import type { Graph, IMapItem, INodes } from '@/interface';
import MinHeap from '@/utils/MinHeap';

type AdjList = Record<string, { to: string; weight: number }[]>;

/**
 * Build adjacency list from nodes.neighbors (fast O(n))
 */
function buildAdjacency(graph: Graph): AdjList {
  const adj: AdjList = {};
  const nodeMap = Object.fromEntries(graph.nodes.map((n) => [n.id, n]));

  for (const node of graph.nodes) {
    const list = [];
    for (const neighborId of node.neighbors ?? []) {
      const neighbor = nodeMap[neighborId];
      if (!neighbor) continue;
      const dx = (node.x ?? 0) - (neighbor.x ?? 0);
      const dy = (node.y ?? 0) - (neighbor.y ?? 0);
      const weight = Math.hypot(dx, dy);
      list.push({ to: neighborId, weight });
    }
    adj[node.id] = list;
  }

  return adj;
}

/**
 * Euclidean distance heuristic for A*
 */
function heuristic(a: INodes, b: INodes): number {
  const dx = (a.x ?? 0) - (b.x ?? 0);
  const dy = (a.y ?? 0) - (b.y ?? 0);
  return Math.hypot(dx, dy);
}

/**
 * Optimized A* using priority queue
 */
export function findShortestPath(
  graph: Graph,
  startNode: string,
  endNode: string,
  prebuiltAdj?: AdjList
) {
  const adj = prebuiltAdj ?? buildAdjacency(graph);
  const nodeMap = Object.fromEntries(graph.nodes.map((n) => [n.id, n]));

  if (!adj[startNode]) throw new Error(`Start node ${startNode} not found`);
  if (!adj[endNode]) throw new Error(`End node ${endNode} not found`);

  const gScore: Record<string, number> = {};
  const fScore: Record<string, number> = {};
  const cameFrom: Record<string, string | null> = {};
  for (const id in adj) {
    gScore[id] = Infinity;
    fScore[id] = Infinity;
    cameFrom[id] = null;
  }

  gScore[startNode] = 0;
  fScore[startNode] = heuristic(nodeMap[startNode], nodeMap[endNode]);

  const openHeap = new MinHeap<string>();
  openHeap.push(fScore[startNode], startNode);
  const openSet = new Set<string>([startNode]);

  while (openHeap.size > 0) {
    const current = openHeap.pop()!;
    openSet.delete(current);

    if (current === endNode) {
      const path: string[] = [];
      let node: string | null = current;
      while (node) {
        path.unshift(node);
        node = cameFrom[node];
      }
      return { nodes: path, distance: gScore[endNode] };
    }

    for (const { to, weight } of adj[current]) {
      const tentativeG = gScore[current] + weight;
      if (tentativeG < gScore[to]) {
        cameFrom[to] = current;
        gScore[to] = tentativeG;
        fScore[to] = tentativeG + heuristic(nodeMap[to], nodeMap[endNode]);
        if (!openSet.has(to)) {
          openSet.add(to);
          openHeap.push(fScore[to], to);
        }
      }
    }
  }

  return { nodes: [], distance: Infinity };
}

/**
 * Find nearest graph node (path node only)
 */
function findNearestNode(graph: Graph, point: { x: number; y: number }): string | null {
  let nearest: string | null = null;
  let best = Infinity;
  for (const n of graph.nodes) {
    const dx = point.x - (n.x ?? 0);
    const dy = point.y - (n.y ?? 0);
    const d = dx * dx + dy * dy;
    if (d < best) {
      best = d;
      nearest = n.id;
    }
  }
  return nearest;
}

/**
 * Single-source Dijkstra (returns distances and predecessors for path reconstruction)
 * Dijkstra search + path finding algo is very good for 2D spaces
 * = Pre req for the algo:
 * - graph: Graph object (only needed if there are no preBuiltAdj)
 * - startNode: node id to start from
 * - prebuiltAdj: optional adjacency list to reuse (recommended)
 */
export function findShortestPathSingleSource(
  graph: Graph,
  startNode: string,
  prebuiltAdj?: AdjList
): { dist: Record<string, number>; prev: Record<string, string | null> } | null {
  const adj = prebuiltAdj ?? buildAdjacency(graph);

  if (!adj[startNode]) {
    // start not in adjacency
    return null;
  }

  const dist: Record<string, number> = {};
  const prev: Record<string, string | null> = {};

  // init
  for (const id in adj) {
    dist[id] = Infinity;
    prev[id] = null;
  }
  dist[startNode] = 0;

  const open = new MinHeap<string>();
  open.push(0, startNode);

  while (open.size > 0) {
    const u = open.pop()!;
    // If we've popped a node whose current stored dist is larger than recorded dist,
    // skip it (stale heap entry).
    const du = dist[u];
    if (!isFinite(du)) continue;

    // relax neighbors
    for (const { to, weight } of adj[u] ?? []) {
      const alt = du + weight;
      if (alt < (dist[to] ?? Infinity)) {
        dist[to] = alt;
        prev[to] = u;
        open.push(alt, to);
      }
    }
  }

  return { dist, prev };
}

/**
 * Path between two maps (optimized with prebuilt adjacency)
 */
/**
 * Optimized: Path between two maps (handles multiple same-name destinations).
 * - Caches entrance->pathNodes resolution
 * - Runs shortest-path search once per start node and reuses results for all candidate end nodes
 */
export function findPathBetweenPlacesOptimized(graph: Graph, placeA: string, placeB: string) {
  // ✅ Helper to find place in maps OR entrances
  const findPlace = (identifier: string): IMapItem | null => {
    // Try maps first
    let place = graph.maps.find((p) => p.id === identifier) || 
                graph.maps.find((p) => p.name === identifier);
    
    if (place) return place;
    
    // ✅ Try entrances
    const entrance = graph.entrances?.find((e) => e.id === identifier);
    if (entrance) {
      return {
        id: entrance.id,
        name: entrance.id,
        type: 'entrance',
        entranceNodes: [entrance.id],
        path: '',
        centroid: [entrance.x, entrance.y],
        floor: '',
      } as IMapItem;
    }
    
    return null;
  };

  const p1 = findPlace(placeA);
  if (!p1) {
    console.warn('Source place not found', { placeA });
    return null;
  }

  const p2Candidates = graph.maps.filter((p) => p.id === placeB || p.name === placeB);
  
  // ✅ Also check entrances for destination
  if (p2Candidates.length === 0) {
    const entranceDestination = findPlace(placeB);
    if (entranceDestination) {
      p2Candidates.push(entranceDestination);
    }
  }
  
  if (!p2Candidates || p2Candidates.length === 0) {
    console.warn('Destination place(s) not found', { placeB });
    return null;
  }

  console.log(p1)
  console.log(p2Candidates)

  // ---------- 1) CACHES ----------
  // cache for entranceId -> resolved path node ids
  const entranceToPathNodesCache = new Map<string, string[]>();

  const getEntranceIds = (p: IMapItem): string[] => {
    if (Array.isArray(p.entranceNodes) && p.entranceNodes.length > 0)
      return p.entranceNodes.filter((id) => graph.entrances?.some((e) => e.id === id));
    return [];
  };

  const resolveEntranceToPathNodes = (entranceIds: string[]) => {
    const pathNodes: string[] = [];
    for (const id of entranceIds) {
      if (entranceToPathNodesCache.has(id)) {
        pathNodes.push(...(entranceToPathNodesCache.get(id) || []));
        continue;
      }

      const entrance = graph.entrances?.find((e) => e.id === id);
      if (!entrance) {
        entranceToPathNodesCache.set(id, []);
        continue;
      }

      let neighborPaths =
        entrance.neighbors?.filter((nid) => graph.nodes.some((n) => n.id === nid)) || [];

      if (neighborPaths.length === 0) {
        const nearest = findNearestNode(graph, { x: entrance.x, y: entrance.y });
        if (nearest) neighborPaths.push(nearest);
      }

      neighborPaths = [...new Set(neighborPaths)];
      entranceToPathNodesCache.set(id, neighborPaths);
      pathNodes.push(...neighborPaths);
    }
    return [...new Set(pathNodes)];
  };

  // helper to map a path-node back to the best entrance id (cached)
  const nodeToEntranceCache = new Map<string, string>(); // nodeId -> entranceId
  const findEntranceIdForNode = (entranceIds: string[], nodeId: string) => {
    // try cached mapping first
    if (nodeToEntranceCache.has(nodeId)) {
      const cached = nodeToEntranceCache.get(nodeId)!;
      if (entranceIds.includes(cached)) return cached;
    }

    for (const id of entranceIds) {
      const entranceNodes = entranceToPathNodesCache.get(id) || resolveEntranceToPathNodes([id]);
      if (entranceNodes.includes(nodeId)) {
        nodeToEntranceCache.set(nodeId, id);
        return id;
      }
      // fallback: nearest
      const entrance = graph.entrances?.find((e) => e.id === id);
      if (entrance) {
        const nearest = findNearestNode(graph, { x: entrance.x, y: entrance.y });
        if (nearest === nodeId) {
          nodeToEntranceCache.set(nodeId, id);
          return id;
        }
      }
    }
    // fallback to first entrance id
    const fallback = entranceIds[0] || '';
    if (fallback) nodeToEntranceCache.set(nodeId, fallback);
    return fallback;
  };

  // ---------- 2) Resolve start nodes once ----------
  const entranceAIds = getEntranceIds(p1);
  const startNodes = resolveEntranceToPathNodes(entranceAIds);
  if (startNodes.length === 0) {
    console.warn('No valid start path nodes for source place', { p1, entranceAIds });
    return null;
  }

  const adj = buildAdjacency(graph);

  // ---------- 3) Pre-resolve end nodes per candidate (with caching) ----------
  // Keep a small list of candidate objects with resolved endNodes and entranceIds
  const candidatesResolved = p2Candidates
    .map((candidate) => {
      const candidateEntranceIds = getEntranceIds(candidate);
      const endNodes = resolveEntranceToPathNodes(candidateEntranceIds);
      return {
        candidate,
        candidateEntranceIds,
        endNodes,
      };
    })
    .filter((c) => c.endNodes.length > 0);

  if (candidatesResolved.length === 0) {
    console.warn('No valid end path nodes for any destination candidate', { placeB });
    return null;
  }

  // ---------- 4) MAIN OPTIMIZATION ----------
  // Instead of findShortestPath for every (s,t), run shortest-path once per start node s.
  // We'll assume findShortestPath can return distances to all nodes (if not, replace with a Dijkstra that does).
  // If your findShortestPath only computes path between two nodes, implement a single-source Dijkstra that returns dist[] & prev[].

  let overallBest: {
    candidate: IMapItem;
    nodes: string[];
    distance: number;
    startEntranceId: string;
    endEntranceId: string;
  } | null = null;

  // If you have a multi-source Dijkstra implementation, you can run it once from all startNodes (virtual source trick).
  // For simplicity we run single-source Dijkstra per start node here (much faster than previously repeated calls).
  for (const s of startNodes) {
    // assume findShortestPathSingleSource returns { dist: Record<nodeId,number>, prev: Record<nodeId, string|null> }
    const singleSourceRes = findShortestPathSingleSource(graph, s, adj);
    if (!singleSourceRes) continue;
    const { dist, prev } = singleSourceRes;

    // evaluate all candidates/endNodes
    for (const { candidate, candidateEntranceIds, endNodes } of candidatesResolved) {
      // find best end node (t) for this candidate given precomputed dist[]
      let bestT: { nodeId: string; distance: number } | null = null;
      for (const t of endNodes) {
        const d = dist[t];
        if (typeof d !== 'number' || !isFinite(d)) continue;
        if (!bestT || d < bestT.distance) bestT = { nodeId: t, distance: d };
      }
      if (!bestT) continue;

      // reconstruct path from s -> bestT.nodeId using prev
      const nodesPath: string[] = [];
      let cur: string | null = bestT.nodeId;
      while (cur) {
        nodesPath.push(cur);
        cur = prev[cur] || null;
      }
      nodesPath.reverse(); // now s..t

      // map s,t back to entrances
      const startEntranceId = findEntranceIdForNode(entranceAIds, s);
      const endEntranceId = findEntranceIdForNode(candidateEntranceIds, bestT.nodeId);

      if (!overallBest || bestT.distance < overallBest.distance) {
        overallBest = {
          candidate,
          nodes: nodesPath,
          distance: bestT.distance,
          startEntranceId,
          endEntranceId,
        };
      }
    }
  }

  if (!overallBest) {
    console.warn('No route found to any candidate destination', { placeA, placeB });
    return null;
  }

  return {
    nodes: [overallBest.startEntranceId, ...overallBest.nodes, overallBest.endEntranceId],
    distance: overallBest.distance,
    chosenDestination: {
      id: overallBest.candidate.id,
      name: overallBest.candidate.name,
      floor: overallBest.candidate.floor,
      centroid: overallBest.candidate.centroid,
    },
  };
}
