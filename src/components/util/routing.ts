// utils/routing.ts
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

      // bidirectional
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
    let current: string = [...openSet].reduce((a, b) => (fScore[a] < fScore[b] ? a : b));

    if (current === endNode) {
      const path: string[] = [];
      while (current) {
        path.unshift(current);
        current = cameFrom[current]!;
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
 * Compute centroid of a polygon path string (M/L commands only)
 */
function computeCentroid(pathStr: string): { x: number; y: number } {
  const numbers = pathStr.match(/-?\d+(\.\d+)?/g)?.map(Number) || [];
  const xs = numbers.filter((_, i) => i % 2 === 0);
  const ys = numbers.filter((_, i) => i % 2 === 1);

  const cx = xs.reduce((a, b) => a + b, 0) / xs.length;
  const cy = ys.reduce((a, b) => a + b, 0) / ys.length;

  return { x: cx, y: cy };
}

/**
 * Find nearest graph node to a given point
 */
function findNearestNode(graph: Graph, point: { x: number; y: number }): string | null {
  let nearest: string | null = null;
  let bestDist = Infinity;

  for (const node of graph.nodes) {
    if (node.type === 'circle') {
      // only route to the path nodes
      const d = Math.hypot(point.x - (node.x ?? 0), point.y - (node.y ?? 0));
      if (d < bestDist) {
        bestDist = d;
        nearest = node.id;
      }
    }
  }

  return nearest;
}

/**
 * Path between places (auto-nearest-node if entranceNode not set)
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

  const validNode = (id: string) => graph.nodes.some((n) => n.id === id);

  const getNodes = (p: Place) => {
    if (p.entranceNode && validNode(p.entranceNode)) return [p.entranceNode];
    if (p.entranceNodes) return p.entranceNodes.filter(validNode);

    // fallback: nearest node to polygon centroid
    if (p.path) {
      const centroid = computeCentroid(p.path);
      const nearest = findNearestNode(graph, centroid);
      return nearest ? [nearest] : [];
    }

    return [];
  };

  const startNodes = getNodes(p1);
  const endNodes = getNodes(p2);

  if (startNodes.length === 0 || endNodes.length === 0) {
    console.warn('No valid nodes for one or both places', { p1, p2 });
    return null;
  }

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

  return best;
}
