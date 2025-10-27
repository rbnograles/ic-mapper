/**
 * Map Store
 * State management of our main indoor map
 * This includes setting selected map via ID, Name, Type
 * Puting map details
 */
import { create } from 'zustand';
import { IMapItem, IPlace, RouteStep } from '@/interface';

interface IMapStore {
  // main state
  highlightedPlace: IPlace;
  map: IMapItem;
  selectedMap: string;
  selectedType: string;
  selectedFloorMap: string;
  activeNodeIds: string[];
  multiFloorRoute: {
    isActive: boolean;
    currentStep: number;
    steps: RouteStep[];
    finalDestination: IMapItem | null;
  };
  isCalculatingRoute: boolean;
  setIsCalculatingRoute: (isCalculating: boolean) => void;
  // handlers
  handlePathSelect: (path: IMapItem | IPlace) => void;
  setMapItems: (path: IMapItem) => void;
  setSelectedId: (id: string) => void;
  setSelectedName: (name: string) => void;
  setSelectedType: (type: string) => void;
  clearSelectedType: () => void;
  setSelectedFloorMap: (floor: string) => void;
  setActiveNodeIds: (nodeIds: string[]) => void;
  resetMap: () => void;
  setMultiFloorRoute: (steps: RouteStep[], finalDestination: IMapItem) => void;
  nextRouteStep: () => void;
  clearMultiFloorRoute: () => void;
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

const useMapStore = create<IMapStore>()((set, get) => ({
  // main state
  highlightedPlace: newPlace,
  map: newMap,
  selectedMap: '',
  selectedType: '',
  selectedFloorMap: 'ground',
  activeNodeIds: [],
  multiFloorRoute: {
    isActive: false,
    currentStep: 0,
    steps: [],
    finalDestination: null,
  },
  isCalculatingRoute: false,

  // handlers
  setMapItems: (path) => {
    if (path !== null) {
      set(() => ({
        map: path,
      }));
    }
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
      selectedType: type,
    }));
  },

  clearSelectedType: () => set(() => ({ selectedType: '' })),

  setActiveNodeIds: (nodeIds: string[]) => {
    set(() => ({
      activeNodeIds: nodeIds,
    }));
  },

  setSelectedFloorMap: (floor) => {
    set(() => ({
      selectedFloorMap: floor,
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
  setMultiFloorRoute: (steps, finalDestination) => {
    set(() => ({
      multiFloorRoute: {
        isActive: true,
        currentStep: 0,
        steps,
        finalDestination: finalDestination,
      },
    }));
  },

  nextRouteStep: () => {
    const { multiFloorRoute } = get();
    const nextStep = multiFloorRoute.currentStep + 1;

    if (nextStep >= multiFloorRoute.steps.length) {
      // Route complete
      set(() => ({
        multiFloorRoute: {
          isActive: false,
          currentStep: 0,
          steps: [],
          finalDestination: null,
        },
      }));
    } else {
      set(() => ({
        multiFloorRoute: {
          ...multiFloorRoute,
          currentStep: nextStep,
        },
      }));
    }
  },

  clearMultiFloorRoute: () => {
    set(() => ({
      multiFloorRoute: {
        isActive: false,
        currentStep: 0,
        steps: [],
        finalDestination: null,
      },
    }));
  },
  
  setIsCalculatingRoute: (b) => {
    set((s) => ({
      isCalculatingRoute: b,
    }));
  },
}));

export default useMapStore;