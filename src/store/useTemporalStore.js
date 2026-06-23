import { create } from 'zustand';
import { executeQuery } from '../core/engine/queryClient';
import { QUERIES } from '../core/engine/queries';
import { parseArrowBuffer } from '../core/arrow/arrowParsers';
import { GEOSPATIAL_CONFIG } from '../core/config/geospatial';

const INITIAL_FILTERS = {
  timeRange: [0, 23],
  dayOfWeek: 'all',
  dateRange: null
};

export const useTemporalStore = create((set, get) => ({
  filtersA: { ...INITIAL_FILTERS },
  filtersB: { ...INITIAL_FILTERS },
  compareMode: false,
  activeLayer: 'Points',
  playbackState: { isPlaying: false, intervalId: null },
  
  viewState: GEOSPATIAL_CONFIG.INITIAL_VIEW_STATE,

  dataA: { kpis: null, violations: [], vehicleMix: [] },
  dataB: { kpis: null, violations: [], vehicleMix: [] },
  weeklyHeatmapData: [],
  
  isLoadingA: false,
  isLoadingB: false,
  isLoadingHeatmap: false,
  error: null,

  setFiltersA: (newFilters) => {
    set((state) => ({ filtersA: { ...state.filtersA, ...newFilters } }));
    get().fetchDataA();
  },

  setFiltersB: (newFilters) => {
    set((state) => ({ filtersB: { ...state.filtersB, ...newFilters } }));
    get().fetchDataB();
  },

  setCompareMode: (enabled) => {
    set({ compareMode: enabled });
    if (enabled) {
      get().fetchDataB();
    }
  },

  setActiveLayer: (layer) => {
    set({ activeLayer: layer });
  },

  setViewState: (newViewState) => {
    set({ viewState: newViewState });
  },

  togglePlayback: () => {
    const state = get();
    if (state.playbackState.isPlaying) {
      clearInterval(state.playbackState.intervalId);
      set({ playbackState: { isPlaying: false, intervalId: null } });
    } else {
      // Logic for sweeping a 3-hour window
      const intervalId = setInterval(() => {
        const { filtersA } = get();
        let start = filtersA.timeRange[0] + 1;
        let end = filtersA.timeRange[1] + 1;
        
        if (end > 23) {
          start = 0;
          end = end - filtersA.timeRange[0]; // keep window width
        }
        get().setFiltersA({ timeRange: [start, end] });
      }, 700);
      set({ playbackState: { isPlaying: true, intervalId } });
    }
  },

  resetPlayback: () => {
    const state = get();
    if (state.playbackState.intervalId) {
      clearInterval(state.playbackState.intervalId);
    }
    set({ playbackState: { isPlaying: false, intervalId: null } });
    get().setFiltersA({ timeRange: [0, 23] });
  },

  fetchDataA: async () => {
    const { filtersA } = get();
    set({ isLoadingA: true, error: null });
    try {
      const [kpis, violations, mix] = await Promise.all([
        executeQuery(QUERIES.getTemporalKPIs(filtersA)).then(parseArrowBuffer),
        executeQuery(QUERIES.getTemporalViolations(filtersA)).then(parseArrowBuffer),
        executeQuery(QUERIES.getTemporalVehicleMix(filtersA)).then(parseArrowBuffer)
      ]);
      
      const kpisData = (kpis.violations_in_window && kpis.violations_in_window.length > 0) ? {
        violationsInWindow: Number(kpis.violations_in_window[0]),
        totalViolations: Number(kpis.total_violations[0]),
        topStationCode: kpis.top_station_code[0],
        topStationCount: Number(kpis.top_station_count[0]),
        peakDow: Number(kpis.peak_dow[0]),
        peakHour: Number(kpis.peak_hour[0])
      } : null;

      const violationsList = [];
      if (violations.latitude) {
        for (let i = 0; i < violations.latitude.length; i++) {
          violationsList.push({
            latitude: violations.latitude[i],
            longitude: violations.longitude[i],
            vehicle_type: violations.vehicle_type[i],
            hour: Number(violations.hour_val[i])
          });
        }
      }

      const vehicleMix = [];
      if (mix.type) {
        for (let i = 0; i < mix.type.length; i++) {
          vehicleMix.push({
            type: mix.type[i],
            count: Number(mix.count[i])
          });
        }
      }

      set((state) => ({ 
        dataA: { kpis: kpisData, violations: violationsList, vehicleMix }, 
        isLoadingA: false 
      }));
    } catch (err) {
      set({ error: err.message, isLoadingA: false });
    }
  },

  fetchDataB: async () => {
    const { filtersB } = get();
    set({ isLoadingB: true, error: null });
    try {
      const [kpis, violations, mix] = await Promise.all([
        executeQuery(QUERIES.getTemporalKPIs(filtersB)).then(parseArrowBuffer),
        executeQuery(QUERIES.getTemporalViolations(filtersB)).then(parseArrowBuffer),
        executeQuery(QUERIES.getTemporalVehicleMix(filtersB)).then(parseArrowBuffer)
      ]);
      
      const kpisData = (kpis.violations_in_window && kpis.violations_in_window.length > 0) ? {
        violationsInWindow: Number(kpis.violations_in_window[0]),
        totalViolations: Number(kpis.total_violations[0]),
        topStationCode: kpis.top_station_code[0],
        topStationCount: Number(kpis.top_station_count[0]),
        peakDow: Number(kpis.peak_dow[0]),
        peakHour: Number(kpis.peak_hour[0])
      } : null;

      const violationsList = [];
      if (violations.latitude) {
        for (let i = 0; i < violations.latitude.length; i++) {
          violationsList.push({
            latitude: violations.latitude[i],
            longitude: violations.longitude[i],
            vehicle_type: violations.vehicle_type[i],
            hour: Number(violations.hour_val[i])
          });
        }
      }

      const vehicleMix = [];
      if (mix.type) {
        for (let i = 0; i < mix.type.length; i++) {
          vehicleMix.push({
            type: mix.type[i],
            count: Number(mix.count[i])
          });
        }
      }

      set((state) => ({ 
        dataB: { kpis: kpisData, violations: violationsList, vehicleMix }, 
        isLoadingB: false 
      }));
    } catch (err) {
      set({ error: err.message, isLoadingB: false });
    }
  },

  fetchWeeklyHeatmap: async () => {
    set({ isLoadingHeatmap: true, error: null });
    try {
      const buffer = await executeQuery(QUERIES.getWeeklyHeatmap());
      const parsed = parseArrowBuffer(buffer);
      
      const heatmap = [];
      if (parsed.dow) {
        for (let i = 0; i < parsed.dow.length; i++) {
          heatmap.push({
            dow: Number(parsed.dow[i]),
            hour: Number(parsed.hour_val[i]),
            count: Number(parsed.count[i]),
            mean: Number(parsed.mean[i]),
            std: Number(parsed.std[i])
          });
        }
      }
      set({ weeklyHeatmapData: heatmap, isLoadingHeatmap: false });
    } catch (err) {
      set({ error: err.message, isLoadingHeatmap: false });
    }
  }
}));
