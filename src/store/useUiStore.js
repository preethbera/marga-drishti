import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Bengaluru bounding box roughly
const BENGALURU_BOUNDS = [
  [77.35, 12.75], // Southwest coordinates
  [77.85, 13.15]  // Northeast coordinates
];

export const useUiStore = create(persist((set) => ({
  viewport: {
    longitude: 77.5946,
    latitude: 12.9716,
    zoom: 11,
    minZoom: 10,
    maxBounds: BENGALURU_BOUNDS
  },
  filters: {
    vehicleTypes: [], // e.g. 'LMV', 'HMV', '2W'
    offenceCodes: [], // e.g. 102, 103
    hourRange: [0, 23]
  },
  isLoading: false,
  isDataLoaded: false,
  dataRowCount: 0,
  logs: [],
  availableDatasets: [],
  activeDatasetId: null,

  setViewport: (viewportUpdate) => set((state) => ({
    viewport: { ...state.viewport, ...viewportUpdate }
  })),

  setFilters: (filtersUpdate) => set((state) => ({
    filters: { ...state.filters, ...filtersUpdate }
  })),

  setIsLoading: (isLoading) => set({ isLoading }),
  setIsDataLoaded: (isDataLoaded, dataRowCount = 0) => set({ isDataLoaded, dataRowCount }),
  addLog: (message) => set((state) => ({ logs: [...state.logs, { time: new Date().toLocaleTimeString(), message }] })),
  setAvailableDatasets: (datasets) => set({ availableDatasets: datasets }),
  setActiveDatasetId: (id) => set({ activeDatasetId: id }),
}), {
  name: 'marga-drishti-storage',
  partialize: (state) => ({ activeDatasetId: state.activeDatasetId }),
}));
