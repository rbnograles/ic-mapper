/**
 * Map Store
 * State management of our main indoor map
 * This includes setting selected map via ID, Name, Type
 * Puting map details
 */
import { create } from 'zustand';
import { IMapItem, IPlace } from '@/interface';

interface IMapStore {
  // main state
  highlightedPlace: IPlace;
  map: IMapItem;
  selectedMap: string;
  selectedType: string;
  activeNodeIds: string[];
  // handlers
  handlePathSelect: (path: IMapItem | IPlace) => void;
  setMapItems: (path: IMapItem) => void;
  setSelectedId: (id: string) => void;
  setSelectedName: (name: string) => void;
  setSelectedType: (type: string) => void;
  clearSelectedType: () => void;
  setActiveNodeIds: (nodeIds: string[]) => void;
  resetMap: () => void;
}

const newPlace: IPlace = {
  id: '',
  name: '',
};

const newMap: IMapItem = {
  id: '',
  name: '',
  type: '',
  entranceNodes: [],
  path: '',
  centroid: [],
  floor: '',
};

const useMapStore = create<IMapStore>()((set) => ({
  // main state
  highlightedPlace: newPlace,
  map: newMap,
  selectedMap: '',
  selectedType: '',
  activeNodeIds: [],

  // handlers
  setMapItems: (path) => {
    set(() => ({
      map: path,
    }));
  },

  handlePathSelect: (by) => {
    const id = (by as any).id ?? '';
    const name = (by as any).name ?? '';
    set(() => ({
      highlightedPlace: { id, name },
      activeNodeIds: [],
    }));
  },

  setSelectedId: (id) => {
    set((state) => ({
      highlightedPlace: {
        ...state.highlightedPlace,
        type: '',
        id,
      },
    }));
  },

  setSelectedName: (name) => {
    set((state) => ({
      highlightedPlace: {
        ...state.highlightedPlace,
        type: '',
        name,
      },
    }));
  },

  setSelectedType: (type) => {
    set(() => ({
     selectedType: type
    }));
  },

  clearSelectedType: () => set(() => ({ selectedType: '' })),

  setActiveNodeIds: (nodeIds: string[]) => {
    set(() => ({
      activeNodeIds: nodeIds,
    }));
  },

  resetMap: () => {
    set(() => ({
      map: newMap,
      activeNodeIds: [],
      highlightedPlace: newPlace,
      selectedMap: '',
      selectedType: '',
    }));
  },
}));

export default useMapStore;
