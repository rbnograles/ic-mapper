import type { Graph, IMapItem, INodes } from '@/types';
import MinHeap from '@/routing/utils/MinHeap';

type AdjList = Record<string, { to: string; weight: number }[]>;

/**
 * Core pathfinding algorithms
 */
class PathfindingAlgorithm {
  protected adj: AdjList;
  protected nodeMap: Map<string, INodes>;

  constructor(protected graph: Graph) {
    this.adj = this.buildAdjacency();
    this.nodeMap = new Map(graph.nodes.map((n) => [n.id, n]));
  }

  private buildAdjacency(): AdjList {
    const adj: AdjList = {};
    const nodeMap = Object.fromEntries(this.graph.nodes.map((n) => [n.id, n]));

    for (const node of this.graph.nodes) {
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

  protected heuristic(a: INodes, b: INodes): number {
    const dx = (a.x ?? 0) - (b.x ?? 0);
    const dy = (a.y ?? 0) - (b.y ?? 0);
    return Math.hypot(dx, dy);
  }

  protected findNearestNode(point: { x: number; y: number }): string | null {
    let nearest: string | null = null;
    let best = Infinity;
    for (const n of this.graph.nodes) {
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

  getAdjacency(): AdjList {
    return this.adj;
  }
}

/**
 * A* Algorithm implementation
 */
class AStarPathfinder extends PathfindingAlgorithm {
  findPath(startNode: string, endNode: string): { nodes: string[]; distance: number } {
    if (!this.adj[startNode]) throw new Error(`Start node ${startNode} not found`);
    if (!this.adj[endNode]) throw new Error(`End node ${endNode} not found`);

    const gScore: Record<string, number> = {};
    const fScore: Record<string, number> = {};
    const cameFrom: Record<string, string | null> = {};

    for (const id in this.adj) {
      gScore[id] = Infinity;
      fScore[id] = Infinity;
      cameFrom[id] = null;
    }

    const startNodeObj = this.nodeMap.get(startNode)!;
    const endNodeObj = this.nodeMap.get(endNode)!;

    gScore[startNode] = 0;
    fScore[startNode] = this.heuristic(startNodeObj, endNodeObj);

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

      for (const { to, weight } of this.adj[current]) {
        const tentativeG = gScore[current] + weight;
        if (tentativeG < gScore[to]) {
          cameFrom[to] = current;
          gScore[to] = tentativeG;
          const toNode = this.nodeMap.get(to)!;
          fScore[to] = tentativeG + this.heuristic(toNode, endNodeObj);
          if (!openSet.has(to)) {
            openSet.add(to);
            openHeap.push(fScore[to], to);
          }
        }
      }
    }

    return { nodes: [], distance: Infinity };
  }
}

/**
 * Dijkstra's Algorithm implementation
 */
class DijkstraPathfinder extends PathfindingAlgorithm {
  findShortestPaths(startNode: string): {
    dist: Record<string, number>;
    prev: Record<string, string | null>;
  } | null {
    if (!this.adj[startNode]) return null;

    const dist: Record<string, number> = {};
    const prev: Record<string, string | null> = {};

    for (const id in this.adj) {
      dist[id] = Infinity;
      prev[id] = null;
    }
    dist[startNode] = 0;

    const open = new MinHeap<string>();
    open.push(0, startNode);

    while (open.size > 0) {
      const u = open.pop()!;
      const du = dist[u];
      if (!isFinite(du)) continue;

      for (const { to, weight } of this.adj[u] ?? []) {
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

  reconstructPath(
    prev: Record<string, string | null>,
    endNode: string
  ): string[] {
    const path: string[] = [];
    let cur: string | null = endNode;
    while (cur) {
      path.push(cur);
      cur = prev[cur] || null;
    }
    path.reverse();
    return path;
  }
}

/**
 * Manages entrance resolution and caching
 */
class EntranceResolver {
  private entranceToPathNodesCache = new Map<string, string[]>();
  private nodeToEntranceCache = new Map<string, string>();

  constructor(
    private graph: Graph,
    private pathfinder: PathfindingAlgorithm
  ) {}

  getEntranceIds(place: IMapItem): string[] {
    if (Array.isArray(place.entranceNodes) && place.entranceNodes.length > 0) {
      return place.entranceNodes.filter((id) =>
        this.graph.entrances?.some((e) => e.id === id)
      );
    }
    return [];
  }

  resolveEntranceToPathNodes(entranceIds: string[]): string[] {
    const pathNodes: string[] = [];

    for (const id of entranceIds) {
      if (this.entranceToPathNodesCache.has(id)) {
        pathNodes.push(...(this.entranceToPathNodesCache.get(id) || []));
        continue;
      }

      const entrance = this.graph.entrances?.find((e) => e.id === id);
      if (!entrance) {
        this.entranceToPathNodesCache.set(id, []);
        continue;
      }

      let neighborPaths =
        entrance.neighbors?.filter((nid) =>
          this.graph.nodes.some((n) => n.id === nid)
        ) || [];

      if (neighborPaths.length === 0) {
        const nearest = this.pathfinder['findNearestNode']({
          x: entrance.x,
          y: entrance.y,
        });
        if (nearest) neighborPaths.push(nearest);
      }

      neighborPaths = [...new Set(neighborPaths)];
      this.entranceToPathNodesCache.set(id, neighborPaths);
      pathNodes.push(...neighborPaths);
    }

    return [...new Set(pathNodes)];
  }

  findEntranceIdForNode(entranceIds: string[], nodeId: string): string {
    if (this.nodeToEntranceCache.has(nodeId)) {
      const cached = this.nodeToEntranceCache.get(nodeId)!;
      if (entranceIds.includes(cached)) return cached;
    }

    for (const id of entranceIds) {
      const entranceNodes =
        this.entranceToPathNodesCache.get(id) ||
        this.resolveEntranceToPathNodes([id]);
      if (entranceNodes.includes(nodeId)) {
        this.nodeToEntranceCache.set(nodeId, id);
        return id;
      }

      const entrance = this.graph.entrances?.find((e) => e.id === id);
      if (entrance) {
        const nearest = this.pathfinder['findNearestNode']({
          x: entrance.x,
          y: entrance.y,
        });
        if (nearest === nodeId) {
          this.nodeToEntranceCache.set(nodeId, id);
          return id;
        }
      }
    }

    const fallback = entranceIds[0] || '';
    if (fallback) this.nodeToEntranceCache.set(nodeId, fallback);
    return fallback;
  }
}

/**
 * Handles place lookup in maps and entrances
 */
class PlaceFinder {
  constructor(private graph: Graph) {}

  findPlace(identifier: string): IMapItem | null {
    // Try maps first
    let place =
      this.graph.maps.find((p) => p.id === identifier) ||
      this.graph.maps.find((p) => p.name === identifier);

    if (place) return place;

    // Try entrances
    const entrance = this.graph.entrances?.find((e) => e.id === identifier);
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
  }

  findCandidates(identifier: string): IMapItem[] {
    const candidates = this.graph.maps.filter(
      (p) => p.id === identifier || p.name === identifier
    );

    if (candidates.length === 0) {
      const entrance = this.findPlace(identifier);
      if (entrance) candidates.push(entrance);
    }

    return candidates;
  }
}

/**
 * Main router class that orchestrates pathfinding between places
 */
export class GraphRouter {
  private astar: AStarPathfinder;
  private dijkstra: DijkstraPathfinder;
  private entranceResolver: EntranceResolver;
  private placeFinder: PlaceFinder;

  constructor(private graph: Graph) {
    this.astar = new AStarPathfinder(graph);
    this.dijkstra = new DijkstraPathfinder(graph);
    this.entranceResolver = new EntranceResolver(graph, this.astar);
    this.placeFinder = new PlaceFinder(graph);
  }

  /**
   * Find shortest path between two nodes using A*
   */
  findShortestPath(startNode: string, endNode: string) {
    return this.astar.findPath(startNode, endNode);
  }

  /**
   * Find shortest paths from a single source using Dijkstra
   */
  findShortestPathSingleSource(startNode: string) {
    return this.dijkstra.findShortestPaths(startNode);
  }

  /**
   * Find optimized path between two places (handles multiple destinations)
   */
  findPathBetweenPlaces(placeA: string, placeB: string) {
    const p1 = this.placeFinder.findPlace(placeA);
    if (!p1) {
      console.warn('Source place not found', { placeA });
      return null;
    }

    const p2Candidates = this.placeFinder.findCandidates(placeB);
    if (p2Candidates.length === 0) {
      console.warn('Destination place(s) not found', { placeB });
      return null;
    }

    console.log(p1);
    console.log(p2Candidates);

    // Resolve start nodes
    const entranceAIds = this.entranceResolver.getEntranceIds(p1);
    const startNodes = this.entranceResolver.resolveEntranceToPathNodes(entranceAIds);

    if (startNodes.length === 0) {
      console.warn('No valid start path nodes for source place', { p1, entranceAIds });
      return null;
    }

    // Pre-resolve end nodes per candidate
    const candidatesResolved = p2Candidates
      .map((candidate) => {
        const candidateEntranceIds = this.entranceResolver.getEntranceIds(candidate);
        const endNodes = this.entranceResolver.resolveEntranceToPathNodes(
          candidateEntranceIds
        );
        return { candidate, candidateEntranceIds, endNodes };
      })
      .filter((c) => c.endNodes.length > 0);

    if (candidatesResolved.length === 0) {
      console.warn('No valid end path nodes for any destination candidate', { placeB });
      return null;
    }

    // Find best path across all start/end combinations
    let overallBest: {
      candidate: IMapItem;
      nodes: string[];
      distance: number;
      startEntranceId: string;
      endEntranceId: string;
    } | null = null;

    for (const s of startNodes) {
      const singleSourceRes = this.dijkstra.findShortestPaths(s);
      if (!singleSourceRes) continue;

      const { dist, prev } = singleSourceRes;

      for (const { candidate, candidateEntranceIds, endNodes } of candidatesResolved) {
        // Find best end node for this candidate
        let bestT: { nodeId: string; distance: number } | null = null;
        for (const t of endNodes) {
          const d = dist[t];
          if (typeof d !== 'number' || !isFinite(d)) continue;
          if (!bestT || d < bestT.distance) bestT = { nodeId: t, distance: d };
        }
        if (!bestT) continue;

        // Reconstruct path
        const nodesPath = this.dijkstra.reconstructPath(prev, bestT.nodeId);

        // Map nodes back to entrances
        const startEntranceId = this.entranceResolver.findEntranceIdForNode(
          entranceAIds,
          s
        );
        const endEntranceId = this.entranceResolver.findEntranceIdForNode(
          candidateEntranceIds,
          bestT.nodeId
        );

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
}

// Backward compatibility exports
export function findShortestPath(
  graph: Graph,
  startNode: string,
  endNode: string
) {
  const router = new GraphRouter(graph);
  return router.findShortestPath(startNode, endNode);
}

export function findShortestPathSingleSource(
  graph: Graph,
  startNode: string
) {
  const router = new GraphRouter(graph);
  return router.findShortestPathSingleSource(startNode);
}

export function findPathBetweenPlacesOptimized(
  graph: Graph,
  placeA: string,
  placeB: string
) {
  const router = new GraphRouter(graph);
  return router.findPathBetweenPlaces(placeA, placeB);
}