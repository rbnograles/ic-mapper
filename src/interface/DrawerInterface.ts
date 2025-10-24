import { type Dispatch, type JSX, type SetStateAction } from 'react';

export interface IDirectionSearch {
  isMobile: boolean;
  setPointAMethod: React.Dispatch<any>;
  handlePathSearchBehavior: (item: any, type?: 'A' | 'B' | undefined) => void;
  setPointBMethod: React.Dispatch<any>;
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
