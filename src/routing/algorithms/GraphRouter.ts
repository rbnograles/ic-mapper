import { Graph, IMapItem } from "@/types";
import AStarPathfinder from "./AStarPathfinder";
import DijkstraPathfinder from "./DijkstraPathfinder";
import EntranceResolver from "../resolvers/EntranceResolver";
import PlaceFinder from "../resolvers/PlaceFinder";

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