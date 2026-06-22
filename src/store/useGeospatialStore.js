import { create } from 'zustand';
import { executeQuery } from '../core/engine/queryClient';
import { QUERIES } from '../core/engine/queries';
import { parseArrowBuffer } from '../core/arrow/arrowParsers';
import { GEOSPATIAL_CONFIG } from '../core/config/geospatial';

export const useGeospatialStore = create((set, get) => ({
  filters: {
    centerCode: 'all',
    offenceCode: 'all',
    vehicleType: 'all',
  },
  
  viewState: GEOSPATIAL_CONFIG.INITIAL_VIEW_STATE,
  
  data: {
    aggregated: [],
    detailed: [],
    mappings: {
      centers: [],
      offences: [],
      vehicles: [
        { code: 'all', name: 'All Vehicles' },
        { code: 'CAR', name: 'Car' },
        { code: 'TWO_WHEELER', name: 'Two Wheeler' },
        { code: 'THREE_WHEELER', name: 'Three Wheeler' },
        { code: 'HCV', name: 'Heavy Commercial Vehicle' },
        { code: 'LCV', name: 'Light Commercial Vehicle' },
        { code: 'BUS', name: 'Bus' }
      ]
    }
  },
  
  isLoading: false,
  error: null,

  setFilters: (newFilters) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters }
    }));
    get().fetchData();
  },

  setViewState: (newViewState) => {
    set({ viewState: newViewState });
  },

  reset: () => {
    set({
      filters: { centerCode: 'all', offenceCode: 'all', vehicleType: 'all' },
      viewState: GEOSPATIAL_CONFIG.INITIAL_VIEW_STATE
    });
    get().fetchData();
  },

  fetchMappings: async () => {
    try {
      const buffer = await executeQuery(QUERIES.getMappings());
      const parsed = parseArrowBuffer(buffer);
      
      if (!parsed.type || !parsed.code || !parsed.name) return;

      const centers = [{ code: 'all', name: 'All Centers' }];
      const offences = [{ code: 'all', name: 'All Offences' }];

      for (let i = 0; i < parsed.type.length; i++) {
        const item = { code: parsed.code[i], name: parsed.name[i] };
        if (parsed.type[i] === 'center') centers.push(item);
        if (parsed.type[i] === 'offence') offences.push(item);
      }

      set((state) => ({
        data: {
          ...state.data,
          mappings: {
            ...state.data.mappings,
            centers,
            offences
          }
        }
      }));
    } catch (error) {
      console.error('Error fetching mappings:', error);
    }
  },

  fetchData: async () => {
    const { filters } = get();
    set({ isLoading: true, error: null });

    try {
      if (filters.centerCode === 'all') {
        // Fetch Aggregated data
        const sql = QUERIES.getCenterAggregations(filters);
        const buffer = await executeQuery(sql);
        const parsed = parseArrowBuffer(buffer);
        
        const aggregated = [];
        if (parsed.code) {
          for (let i = 0; i < parsed.code.length; i++) {
            aggregated.push({
              code: parsed.code[i],
              name: parsed.name[i],
              count: Number(parsed.count[i]),
              latitude: parsed.latitude[i],
              longitude: parsed.longitude[i]
            });
          }
        }
        
        set((state) => ({ data: { ...state.data, aggregated }, isLoading: false }));
      } else {
        // Fetch Detailed data for Heatmap
        const sql = QUERIES.getDetailedViolations(filters);
        const buffer = await executeQuery(sql);
        const parsed = parseArrowBuffer(buffer);
        
        const detailed = [];
        if (parsed.latitude) {
          for (let i = 0; i < parsed.latitude.length; i++) {
            detailed.push({
              latitude: parsed.latitude[i],
              longitude: parsed.longitude[i],
              vehicle_type: parsed.vehicle_type[i],
              offence_code: parsed.offence_code[i]
            });
          }
        }
        
        set((state) => ({ data: { ...state.data, detailed }, isLoading: false }));
      }
    } catch (error) {
      console.error('Error fetching geospatial data:', error);
      set({ error: error.message, isLoading: false });
    }
  }
}));
