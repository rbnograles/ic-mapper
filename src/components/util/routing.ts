// utils/routing.ts
type NodeItem = {
  id: string;
  name?: string;
  path: string; // polygon path d or area path
};

type EdgeItem = {
  id: string;
  d: string; // path d for the segment
  from?: string; // optional pre-mapped node id
  to?: string;   // optional pre-mapped node id
};

type EdgeWithMeta = EdgeItem & {
  length: number;
  from?: string;
  to?: string;
  startPoint?: { x: number; y: number };
  endPoint?: { x: number; y: number };
};

const SVG_NS = 'http://www.w3.org/2000/svg';

function makePathElement(d: string) {
  const p = document.createElementNS(SVG_NS, 'path');
  p.setAttribute('d', d);
  return p;
}

function getPathLengthAndEndpoints(d: string) {
  try {
    const p = makePathElement(d);
    const length = p.getTotalLength();
    const start = p.getPointAtLength(0);
    const end = p.getPointAtLength(Math.max(0, length - 0.0001));
    return {
      length,
      start: { x: start.x, y: start.y },
      end: { x: end.x, y: end.y },
    };
  } catch (err) {
    console.warn('Invalid path d:', d, err);
    return { length: Infinity, start: null, end: null };
  }
}

function getNodeCenterFromD(d: string) {
  try {
    const p = makePathElement(d);
    const box = p.getBBox();
    return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  } catch {
    return null;
  }
}

function sqDist(a: { x: number; y: number }, b: { x: number; y: number }) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

/**
 * Build graph:
 *  - compute node centers
 *  - compute edge lengths & endpoints
 *  - match each edge endpoint to nearest node (within threshold) OR use from/to if present
 */
export function buildGraphFromData(nodes: NodeItem[], edges: EdgeItem[], options?: { matchThreshold?: number }) {
  const threshold = options?.matchThreshold ?? 40; // px — tune this for your map scale
  const thresholdSq = threshold * threshold;

  // 1) compute node centers
  const nodeCenters: Record<string, { x: number; y: number }> = {};
  nodes.forEach((n) => {
    const c = getNodeCenterFromD(n.path);
    if (c) nodeCenters[n.id] = c;
    else console.warn('Could not compute center for node', n.id);
  });

  // 2) process edges
  const edgesMeta: EdgeWithMeta[] = edges.map((e) => {
    const info = getPathLengthAndEndpoints(e.d);
    return {
      ...e,
      length: info.length || Infinity,
      startPoint: info.start || undefined,
      endPoint: info.end || undefined,
    };
  });

  // 3) match endpoints to nodes (if not provided)
  edgesMeta.forEach((edge) => {
    if (edge.from && edge.to) return; // already mapped

    const start = edge.startPoint;
    const end = edge.endPoint;
    let bestStartId: string | undefined;
    let bestEndId: string | undefined;

    if (start) {
      let bestDist = Infinity;
      for (const nid of Object.keys(nodeCenters)) {
        const d = sqDist(start, nodeCenters[nid]);
        if (d < bestDist) {
          bestDist = d;
          bestStartId = nid;
        }
      }
      if (bestDist > thresholdSq) {
        // too far: maybe manual mapping required
        bestStartId = undefined;
      }
    }

    if (end) {
      let bestDist = Infinity;
      for (const nid of Object.keys(nodeCenters)) {
        const d = sqDist(end, nodeCenters[nid]);
        if (d < bestDist) {
          bestDist = d;
          bestEndId = nid;
        }
      }
      if (bestDist > thresholdSq) bestEndId = undefined;
    }

    // assign if found
    if (bestStartId) edge.from = bestStartId;
    if (bestEndId) edge.to = bestEndId;
  });

  // 4) build adjacency list
  const graph: Record<
    string,
    { to: string; edgeId: string; weight: number }[]
  > = {};

  // init graph nodes
  nodes.forEach((n) => (graph[n.id] = graph[n.id] ?? []));

  edgesMeta.forEach((edge) => {
    const { from, to, id, length } = edge;
    if (!from || !to) {
      console.warn(`Edge ${id} missing from/to mapping — skip or fix manually`, edge);
      return;
    }
    graph[from].push({ to, edgeId: id, weight: length });
    graph[to].push({ to: from, edgeId: id, weight: length }); // undirected
  });

  return { graph, edgesMeta, nodeCenters };
}

/**
 * Dijkstra's algorithm (simple version)
 * Returns { nodesPath: [...nodeId], edgesPath: [...edgeId], distance }
 */
export function dijkstraFindPath(
  graph: Record<string, { to: string; edgeId: string; weight: number }[]>,
  start: string,
  end: string
) {
  const nodes = Object.keys(graph);
  const dist: Record<string, number> = {};
  const prevNode: Record<string, string | null> = {};
  const prevEdge: Record<string, string | null> = {};
  const visited: Set<string> = new Set();

  nodes.forEach((n) => {
    dist[n] = Infinity;
    prevNode[n] = null;
    prevEdge[n] = null;
  });
  if (!graph[start] || !graph[end]) return null;
  dist[start] = 0;

  while (true) {
    // find unvisited node with smallest dist
    let u: string | null = null;
    let best = Infinity;
    for (const n of nodes) {
      if (visited.has(n)) continue;
      if (dist[n] < best) {
        best = dist[n];
        u = n;
      }
    }
    if (u === null) break; // no reachable nodes
    if (u === end) break;
    visited.add(u);

    // relax neighbors
    for (const neighbor of graph[u]) {
      if (visited.has(neighbor.to)) continue;
      const alt = dist[u] + neighbor.weight;
      if (alt < dist[neighbor.to]) {
        dist[neighbor.to] = alt;
        prevNode[neighbor.to] = u;
        prevEdge[neighbor.to] = neighbor.edgeId;
      }
    }
  }

  if (dist[end] === Infinity) return null; // no path

  // backtrack
  const nodesPath: string[] = [];
  const edgesPath: string[] = [];
  let cur: string | null = end;
  while (cur) {
    nodesPath.unshift(cur);
    if (prevEdge[cur]) edgesPath.unshift(prevEdge[cur]!);
    cur = prevNode[cur];
  }

  return { nodesPath, edgesPath, distance: dist[end] };
}
