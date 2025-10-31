import type { Graph } from '@/types';
import { GraphRouter } from './algorithms/GraphRouter';

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