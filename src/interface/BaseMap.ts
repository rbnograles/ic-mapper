export interface PathItem {
  id: string;
  name: string;
  type?: string;
  img?: string;
  description?: string;
  schedule?: ISchedule[];
}

export interface ISchedule {
  time: string;
  date: string;
  volunteers: string[];
  guide: string;
  congregation: string;
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
  centroid: any;
  floor: any;
};

export type Labels = {
  name: string;
  path: string;
  fill: string;
};

export interface Graph {
  nodes: INodes[];
  entrances: INodes[];
  places: Place[];
}

export interface IBaseP {
  id: string;
  name: string;
  path: string;
  baseFill?: string;
  strokeWidth?: string | number;
  icon?: any;
  type?: string;
  isTypeHighlighted: boolean;
  centerX: number | undefined;
  centerY: number | undefined;
}
