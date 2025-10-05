import type { Graph, Place, INodes } from '../../../interface/BaseMap';

/**
 * Lightweight Priority Queue (min-heap)
 */
class MinHeap<T> {
  private heap: { key: number; value: T }[] = [];

  push(key: number, value: T) {
    this.heap.push({ key, value });
    this.bubbleUp();
  }

  pop(): T | undefined {
    if (this.heap.length === 0) return undefined;
    const top = this.heap[0].value;
    const end = this.heap.pop()!;
    if (this.heap.length > 0) {
      this.heap[0] = end;
      this.bubbleDown();
    }
    return top;
  }

  private bubbleUp() {
    let i = this.heap.length - 1;
    const item = this.heap[i];
    while (i > 0) {
      const parent = Math.floor((i - 1) / 2);
      if (this.heap[parent].key <= item.key) break;
      this.heap[i] = this.heap[parent];
      i = parent;
    }
    this.heap[i] = item;
  }

  private bubbleDown() {
    let i = 0;
    const length = this.heap.length;
    const item = this.heap[0];
    while (true) {
      let left = 2 * i + 1;
      let right = 2 * i + 2;
      let smallest = i;
      if (left < length && this.heap[left].key < this.heap[smallest].key)
        smallest = left;
      if (right < length && this.heap[right].key < this.heap[smallest].key)
        smallest = right;
      if (smallest === i) break;
      this.heap[i] = this.heap[smallest];
      i = smallest;
    }
    this.heap[i] = item;
  }

  get size() {
    return this.heap.length;
  }
}

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
 * Path between two places (optimized with prebuilt adjacency)
 */
export function findPathBetweenPlaces(graph: Graph, placeA: string, placeB: string) {
  const p1 = graph.places.find((p) => p.name === placeA);
  const p2 = graph.places.find((p) => p.name === placeB);
  
  if (!p1 || !p2) {
    console.warn('Place not found', { placeA, placeB });
    return null;
  }

  const getEntranceIds = (p: Place): string[] => {
    if (Array.isArray(p.entranceNodes) && p.entranceNodes.length > 0)
      return p.entranceNodes.filter((id) => graph.entrances?.some((e) => e.id === id));
    return [];
  };

  const resolveEntranceToPathNodes = (entranceIds: string[]): string[] => {
    const pathNodes: string[] = [];
    for (const id of entranceIds) {
      const entrance = graph.entrances?.find((e) => e.id === id);
      if (!entrance) continue;
      const neighborPaths =
        entrance.neighbors?.filter((nid) => graph.nodes.some((n) => n.id === nid)) || [];
      if (neighborPaths.length === 0) {
        const nearest = findNearestNode(graph, { x: entrance.x, y: entrance.y });
        if (nearest) neighborPaths.push(nearest);
      }
      pathNodes.push(...neighborPaths);
    }
    return [...new Set(pathNodes)];
  };

  const entranceA = getEntranceIds(p1);
  const entranceB = getEntranceIds(p2);
  const startNodes = resolveEntranceToPathNodes(entranceA);
  const endNodes = resolveEntranceToPathNodes(entranceB);

  if (startNodes.length === 0 || endNodes.length === 0) {
    console.warn('No valid path nodes for one or both places', {
      p1,
      p2,
      entranceA,
      entranceB,
    });
    return null;
  }

  const adj = buildAdjacency(graph);
  let best: { nodes: string[]; distance: number } | null = null;

  for (const s of startNodes) {
    for (const t of endNodes) {
      const res = findShortestPath(graph, s, t, adj);
      if (!res.nodes.length) continue;
      if (!best || res.distance < best.distance) best = res;
    }
  }

  if (!best) return null;
  return {
    nodes: [entranceA[0], ...best.nodes, entranceB[0]],
    distance: best.distance,
  };
}
