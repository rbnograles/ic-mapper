/**
 * Search Store
 * Use for search related interaction
 */
import { IMapItem } from '@/types';
import { create } from 'zustand';

interface ISearchStore {
  // main state
  query: string;
  pointA: IMapItem | null;
  pointB: IMapItem | null;
  displayOptions: any[];
  // actions
  setQuery: (value: string) => void;
  setPointA: (value: IMapItem | null) => void;
  setPointB: (value: IMapItem | null) => void;
  setDisplayOptions: (value: any[]) => void;
}

const useSearchStore = create<ISearchStore>()((set) => ({
  // main state
  query: '',
  pointA: null,
  pointB: null,
  displayOptions: [],
  // handlers
  setQuery: (value) => {
    set(() => ({
        query: value
    }))
  },
  setPointA: (value) => {
    set(() => ({
      pointA: value,
    }));
  },
  setPointB: (value) => {
    set(() => ({
      pointB: value,
    }));
  },
  setDisplayOptions: (value) => {
    set(() => ({
      displayOptions: value,
    }));
  }
}));

export default useSearchStore;
