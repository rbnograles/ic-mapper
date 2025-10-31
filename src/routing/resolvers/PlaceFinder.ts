import { Graph, IMapItem } from "@/types";

export default class PlaceFinder {
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