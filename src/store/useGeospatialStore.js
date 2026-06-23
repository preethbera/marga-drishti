import { create } from 'zustand';
import { executeQuery } from '../core/engine/queryClient';
import { QUERIES } from '../core/engine/queries';
import { parseArrowBuffer, parseArrowToTable } from '../core/arrow/arrowParsers';
import { GEOSPATIAL_CONFIG } from '../core/config/geospatial';

export const useGeospatialStore = create((set, get) => ({
  filters: {
    centerCode: 'all',
    offenceCode: 'all',
    vehicleType: 'all',
  },
  
  viewState: GEOSPATIAL_CONFIG.INITIAL_VIEW_STATE,
  
  data: {
    // Arrow Tables
    mapAggregated: null,
    mapDetailed: null,
    top10: null,
    drillDownStats: null,
    twins: null,
    topOffences: null,
    vehicleMix: null,
    hourlyProfile: null,
    
    // JS Objects for comboboxes
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
        // --- CITY WIDE MODE ---
        // Run concurrent queries for city-wide view
        const [aggBuf, top10Buf, detailedBuf] = await Promise.all([
          executeQuery(QUERIES.getGeoCityAggregations(filters)),
          executeQuery(QUERIES.getGeoTop10List(filters)),
          executeQuery(QUERIES.getGeoDetailedViolations(filters)) // Needed for heatmap
        ]);

        set((state) => ({ 
          data: { 
            ...state.data, 
            mapAggregated: parseArrowToTable(aggBuf),
            top10: parseArrowToTable(top10Buf),
            mapDetailed: parseArrowToTable(detailedBuf),
            // Clear drill-down specific data
            drillDownStats: null,
            twins: null,
            topOffences: null,
            vehicleMix: null,
            hourlyProfile: null
          }, 
          isLoading: false 
        }));
      } else {
        // --- DRILL DOWN MODE ---
        // Run concurrent queries for a specific center
        const [
          detailedBuf, 
          statsBuf, 
          twinsBuf, 
          offencesBuf, 
          vehicleBuf, 
          profileBuf
        ] = await Promise.all([
          executeQuery(QUERIES.getGeoDetailedViolations(filters)),
          executeQuery(QUERIES.getGeoDrillDownStats(filters)),
          executeQuery(QUERIES.getGeoBehaviouralTwins(filters)),
          executeQuery(QUERIES.getGeoTopOffences(filters)),
          executeQuery(QUERIES.getGeoVehicleMix(filters)),
          executeQuery(QUERIES.getGeoHourlyProfile(filters))
        ]);

        set((state) => ({ 
          data: { 
            ...state.data, 
            mapDetailed: parseArrowToTable(detailedBuf),
            drillDownStats: parseArrowToTable(statsBuf),
            twins: parseArrowToTable(twinsBuf),
            topOffences: parseArrowToTable(offencesBuf),
            vehicleMix: parseArrowToTable(vehicleBuf),
            hourlyProfile: parseArrowToTable(profileBuf),
            // Keep mapAggregated and top10 as they were before drill-down, 
            // or clear them if we don't need them in memory
            mapAggregated: null,
            top10: null
          }, 
          isLoading: false 
        }));
      }
    } catch (error) {
      console.error('Error fetching geospatial data:', error);
      set({ error: error.message, isLoading: false });
    }
  }
}));
