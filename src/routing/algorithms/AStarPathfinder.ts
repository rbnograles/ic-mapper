import MinHeap from "./MinHeap";
import PathfindingAlgorithm from "./Pathfinding";


export default class AStarPathfinder extends PathfindingAlgorithm {
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