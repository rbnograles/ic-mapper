import MinHeap from "./MinHeap";
import PathfindingAlgorithm from "./Pathfinding";

export default class DijkstraPathfinder extends PathfindingAlgorithm {
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