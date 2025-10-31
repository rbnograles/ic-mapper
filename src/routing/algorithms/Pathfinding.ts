import { INodes, Graph, AdjList } from "@/types";

export default class PathfindingAlgorithm {
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