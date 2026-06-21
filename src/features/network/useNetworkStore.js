import { create } from 'zustand';
import { MODEL_CONSTANTS } from '../simulation/modelEngine';

export const useNetworkStore = create((set, get) => ({
  timeWindowStart: null,
  timeWindowEnd: null,
  roadClassFilter: [],
  referenceK: MODEL_CONSTANTS.DEFAULT_K || 20,
  selectedSegmentId: null,
  cascadeOriginSegmentId: null,
  cascadeMaxHops: 3,
  cascadeDecayFactor: 0.7,
  sortColumn: 'capacityReduction',
  sortDirection: 'desc',

  setTimeWindow: (start, end) => set({ timeWindowStart: start, timeWindowEnd: end }),
  clearTimeWindow: () => set({ timeWindowStart: null, timeWindowEnd: null }),
  
  toggleRoadClass: (roadClass) => set((state) => {
    const current = state.roadClassFilter;
    if (current.includes(roadClass)) {
      return { roadClassFilter: current.filter(c => c !== roadClass) };
    }
    return { roadClassFilter: [...current, roadClass] };
  }),
  clearRoadClassFilter: () => set({ roadClassFilter: [] }),

  setReferenceK: (value) => {
    const clamped = Math.max(MODEL_CONSTANTS.K_MIN, Math.min(MODEL_CONSTANTS.K_MAX, value));
    set({ referenceK: clamped });
  },

  selectSegment: (segmentId) => set((state) => {
    if (state.cascadeOriginSegmentId !== segmentId) {
      return { selectedSegmentId: segmentId, cascadeOriginSegmentId: null };
    }
    return { selectedSegmentId: segmentId };
  }),
  clearSelectedSegment: () => set({ selectedSegmentId: null }),

  setCascadeOrigin: (segmentId) => set({ cascadeOriginSegmentId: segmentId }),
  clearCascadeOrigin: () => set({ cascadeOriginSegmentId: null }),

  setCascadeMaxHops: (value) => {
    const clamped = Math.max(1, Math.min(8, value));
    set({ cascadeMaxHops: clamped });
  },
  
  setCascadeDecayFactor: (value) => {
    const clamped = Math.max(0.1, Math.min(0.95, value));
    set({ cascadeDecayFactor: clamped });
  },

  setSort: (column) => set((state) => {
    if (state.sortColumn === column) {
      return { sortDirection: state.sortDirection === 'asc' ? 'desc' : 'asc' };
    }
    return { sortColumn: column, sortDirection: 'desc' };
  }),

  resetNetworkFilters: () => set({
    timeWindowStart: null,
    timeWindowEnd: null,
    roadClassFilter: [],
    selectedSegmentId: null,
    cascadeOriginSegmentId: null
  })
}));
