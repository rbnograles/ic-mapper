import type { Graph, Place, INodes } from '../../interface/BaseMap';

type AdjList = Record<string, { to: string; weight: number }[]>;

/**
 * Build adjacency list from nodes.neighbors
 */
function buildAdjacency(graph: Graph): AdjList {
  const adj: AdjList = {};

  for (const node of graph.nodes) {
    adj[node.id] = [];
  }

  for (const node of graph.nodes) {
    for (const neighborId of node.neighbors ?? []) {
      const neighbor = graph.nodes.find((n) => n.id === neighborId);
      if (!neighbor) continue;

      const weight = Math.hypot(
        (node.x ?? 0) - (neighbor.x ?? 0),
        (node.y ?? 0) - (neighbor.y ?? 0)
      );

      // Bidirectional
      adj[node.id].push({ to: neighborId, weight });
      adj[neighborId].push({ to: node.id, weight });
    }
  }

  return adj;
}

/**
 * Euclidean distance heuristic for A*
 */
function heuristic(a: INodes, b: INodes) {
  return Math.hypot((a.x ?? 0) - (b.x ?? 0), (a.y ?? 0) - (b.y ?? 0));
}

/**
 * A* pathfinding
 */
export function findShortestPath(graph: Graph, startNode: string, endNode: string) {
  const adj = buildAdjacency(graph);
  const nodesById = Object.fromEntries(graph.nodes.map((n) => [n.id, n]));

  if (!(startNode in adj)) throw new Error(`Start node ${startNode} not found`);
  if (!(endNode in adj)) throw new Error(`End node ${endNode} not found`);

  const openSet = new Set<string>([startNode]);
  const cameFrom: Record<string, string | null> = {};
  const gScore: Record<string, number> = {};
  const fScore: Record<string, number> = {};

  for (const n of graph.nodes) {
    gScore[n.id] = Infinity;
    fScore[n.id] = Infinity;
    cameFrom[n.id] = null;
  }

  gScore[startNode] = 0;
  fScore[startNode] = heuristic(nodesById[startNode], nodesById[endNode]);

  while (openSet.size > 0) {
    const current = [...openSet].reduce((a, b) => (fScore[a] < fScore[b] ? a : b));

    if (current === endNode) {
      const path: string[] = [];
      let node: string | null = current;
      while (node) {
        path.unshift(node);
        node = cameFrom[node];
      }
      return { nodes: path, distance: gScore[endNode] };
    }

    openSet.delete(current);

    for (const { to, weight } of adj[current]) {
      const tentativeG = gScore[current] + weight;
      if (tentativeG < gScore[to]) {
        cameFrom[to] = current;
        gScore[to] = tentativeG;
        fScore[to] = tentativeG + heuristic(nodesById[to], nodesById[endNode]);
        openSet.add(to);
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
  let bestDist = Infinity;

  for (const node of graph.nodes) {
    const d = Math.hypot(point.x - node.x, point.y - node.y);
    if (d < bestDist) {
      bestDist = d;
      nearest = node.id;
    }
  }

  return nearest;
}

/**
 * Path between two places (must go through entrance → path → entrance)
 */
export function findPathBetweenPlaces(graph: Graph, placeA: string, placeB: string) {
  const p1 = graph.places.find((p) => p.name === placeA);
  const p2 = graph.places.find((p) => p.name === placeB);

  console.log(p1);
  console.log(p2);

  if (!p1 || !p2) {
    console.warn('Place not found', { placeA, placeB });
    return null;
  }

  /**
   * Get valid entrance ids for a place
   */
  const getEntranceIds = (p: Place): string[] => {
    if (Array.isArray(p.entranceNodes) && p.entranceNodes.length > 0) {
      return p.entranceNodes.filter((id) => graph.entrances?.some((e) => e.id === id));
    }
    return [];
  };

  /**
   * Resolve entrance ids to their nearest path node neighbors.
   * This ensures we always start/end on a "path" node.
   */
  const resolveEntranceToPathNodes = (entranceIds: string[]): string[] => {
    const pathNodes: string[] = [];

    for (const id of entranceIds) {
      const entrance = graph.entrances?.find((e) => e.id === id);
      if (!entrance) continue;

      // Use the entrance's defined neighbors that are path nodes
      const neighborPaths =
        entrance.neighbors?.filter((nid) => graph.nodes.some((n) => n.id === nid)) || [];

      // If none found (rare), find nearest node manually
      if (neighborPaths.length === 0) {
        const nearest = findNearestNode(graph, {
          x: entrance.x,
          y: entrance.y,
        });
        if (nearest) neighborPaths.push(nearest);
      }

      pathNodes.push(...neighborPaths);
    }

    return [...new Set(pathNodes)];
  };

  // --- Collect start/end path nodes through entrances ---
  const entranceA = getEntranceIds(p1);
  const entranceB = getEntranceIds(p2);

  const startNodes = resolveEntranceToPathNodes(entranceA);
  const endNodes = resolveEntranceToPathNodes(entranceB);

  // Fallback if none available (rare)
  if (startNodes.length === 0 || endNodes.length === 0) {
    console.warn('No valid path nodes for one or both places', {
      p1,
      p2,
      entranceA,
      entranceB,
    });
    return null;
  }

  // --- Compute best path between all combinations ---
  let best: { nodes: string[]; distance: number } | null = null;

  for (const s of startNodes) {
    for (const t of endNodes) {
      const result = findShortestPath(graph, s, t);
      if (result.nodes.length === 0) continue;
      if (!best || result.distance < best.distance) {
        best = result;
      }
    }
  }

  if (!best) return null;

  // --- Reconstruct with entrances at both ends ---
  const nearestEntranceA = entranceA[0];
  const nearestEntranceB = entranceB[0];

  return {
    nodes: [nearestEntranceA, ...best.nodes, nearestEntranceB],
    distance: best.distance,
  };
}
