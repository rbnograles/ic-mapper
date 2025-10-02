export interface PathItem {
  id: string;
  name: string;
  type?: string;
  img?: string;
  description?: string;
}

export interface INodes {
  id: string;
  x?: number;
  y?: number;
  rx?: number;
  ry?: number;
  cx?: number;
  cy?: number;
  type: string;
  neighbors: string[];
}

export interface IEdges {
  id: string;
  d: string;
}

export type Edge = { id: string; from: string; to: string; d?: string | null };
export type Place = { id: string; name: string; nearNodes: string[]; entranceNode: string, path?: string };

export interface Graph {
  nodes: INodes[];
  places: Place[];
}
