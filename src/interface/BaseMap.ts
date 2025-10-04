export interface PathItem {
  id: string;
  name: string;
  type?: string;
  img?: string;
  description?: string;
}

export interface INodes {
  id: string;
  x: number;
  y: number;
  rx?: number;
  ry?: number;
  cx?: number;
  cy?: number;
  type: string;
  neighbors: string[];
}

export type Place = {
  id: string;
  name: string;
  entranceNodes: string[];
  entranceNode: string;
  path?: string;
};

export interface Graph {
  nodes: INodes[];
  entrances: INodes[];
  places: Place[];
}
