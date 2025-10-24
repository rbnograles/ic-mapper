/**
 * Drawer Store
 * Use for opening, closing all drawer, slider, tabs interaction
 */
import { create } from 'zustand';

interface IDrawerStore {
  // main state
  isExpanded: boolean;
  isFloorMapOpen: boolean;
  isLoading: boolean;
  isDirectionPanelOpen: boolean;
  // actions
  setIsExpanded: (value: boolean) => void;
  setIsFloorMapOpen: (value: boolean) => void;
  setIsLoading: (value: boolean) => void;
  setIsDirectionPanelOpen: (value: boolean) => void;
  resetDrawers: () => void;
}

const useDrawerStore = create<IDrawerStore>()((set) => ({
  // main state
  isExpanded: false,
  isFloorMapOpen: false,
  isLoading: false,
  isDirectionPanelOpen: false,
  // handlers
  setIsExpanded: (value) => {
    set(() => ({
      isExpanded: value,
    }));
  },
  setIsFloorMapOpen: (value) => {
    set(() => ({
      isFloorMapOpen: value,
    }));
  },
  setIsLoading: (value) => {
    set(() => ({
      isLoading: value,
    }));
  },
  setIsDirectionPanelOpen: (value) => {
    set(() => ({
      isDirectionPanelOpen: value,
    }));
  },
  resetDrawers: () => {
    set(() => ({
      isExpanded: false,
      isFloorMapOpen: false,
    }));
  },
}));

export default useDrawerStore;
