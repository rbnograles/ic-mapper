export interface IPlace {
  id: string;
  name: string;
}

export interface IMapItem extends IPlace {
  type: string;
  entranceNodes: string[];
  path: string;
  centroid: number[];
  floor: string;
  description?: string;
  baseFill?: string;
  centerX?: number;
  centerY?: number;
  schedule?: ISchedule[];
}

export interface ISchedule {
  time: string;
  date: string;
  volunteers: string[];
  guide: string;
  congregation: string;
}

export interface Graph {
  nodes: INodes[];
  entrances: INodes[];
  maps: IMapItem[];
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

export interface IEntrances extends INodes {}

export type ILabels = {
  name: string;
  path: string;
  fill: string;
};

export interface FloorData {
  floor: string;
  maps: IMapItem[];
  nodes: INodes[];
  entrances: IEntrances[];
  buidingMarks: ILabels[];
  roadMarks: ILabels[];
  boundaries: ILabels[];
}

export type ViaOption = 'Stairs' | 'Elevator' | 'Escalator' | '';

export interface RouteStep {
   floor: string;
  from: string;
  to: string;
  isVerticalTransition: boolean;
  fromId?: string;
  toId?: string;
}
