import { Graph, IMapItem } from "@/types";
import PathfindingAlgorithm from "../algorithms/Pathfinding";

export default class EntranceResolver {
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