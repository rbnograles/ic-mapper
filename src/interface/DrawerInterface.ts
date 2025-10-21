import { type Dispatch, type JSX, type SetStateAction } from 'react';

export interface IDirectionSearch {
  directionOpen: boolean;
  setDirectionOpen: (value: boolean) => void
  isMobile: boolean;
  renderSearchBar: (placeholder: string, value: any, onChange: (val: any) => void) => JSX.Element;
  setPointAMethod: React.Dispatch<any>;
  handlePathSearchBehavior: (item: any, type?: 'A' | 'B' | undefined) => void;
  setPointBMethod: React.Dispatch<any>;
  pointA: any;
  pointB: any;
  handleSwapPoints: () => void;
  getLocationFromHistory: (history: any) => void;
}

export type IFloor = {
  key: string;
  name: string;
  location: string;
  // optional thumbnail url or react node
  thumbnail?: string | React.ReactNode;
};

export interface IFloorCardSelectorProps {
  floors: IFloor[];
  selectedKey?: string | null;
  onSelect: (key: string) => void;
}
