import { create } from 'zustand';
import { executeQuery } from '../core/engine/queryClient';
import { QUERIES } from '../core/engine/queries';
import { parseArrowBuffer } from '../core/arrow/arrowParsers';
import { format, subDays, differenceInDays } from 'date-fns';

export const useExecutiveStore = create((set, get) => ({
  dateRange: { from: null, to: null },
  datasetMinDate: null,
  datasetMaxDate: null,
  isLoading: false,
  error: null,
  
  // Data blocks
  stats: null,
  dailyTrend: null,
  topOffences: null,
  topStations: null,
  vehicleMix: null,
  
  setDateRange: (range) => {
    set({ dateRange: range });
    if (range?.from && range?.to) {
      get().fetchSummaryData(range.from, range.to);
    }
  },

  setPredefinedRange: (days) => {
    const maxDate = get().datasetMaxDate || new Date();
    const fromDate = subDays(maxDate, days);
    get().setDateRange({ from: fromDate, to: maxDate });
  },

  // Initialize by fetching the max/min date range from the dataset
  initializeDefaultRange: async () => {
    set({ isLoading: true, error: null });
    try {
      const buffer = await executeQuery(QUERIES.getExecutiveDateRange());
      const data = parseArrowBuffer(buffer);
      
      // DuckDB might return strings for CAST(... AS VARCHAR)
      if (data.min_date && data.max_date && data.min_date.length > 0) {
        // Find the absolute min and max from the dataset
        const minDateStr = data.min_date[0];
        const maxDateStr = data.max_date[0];
        
        const toDate = new Date(maxDateStr);
        const fromDate = new Date(minDateStr);
        
        set({ datasetMinDate: fromDate, datasetMaxDate: toDate });
        get().setDateRange({ from: fromDate, to: toDate });
      } else {
        // Fallback
        const toDate = new Date();
        const fromDate = subDays(toDate, 30);
        set({ datasetMinDate: fromDate, datasetMaxDate: toDate });
        get().setDateRange({ from: fromDate, to: toDate });
      }
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  fetchSummaryData: async (from, to) => {
    set({ isLoading: true, error: null });
    try {
      const minDate = get().datasetMinDate;
      const maxDate = get().datasetMaxDate;
      
      const isDefaultRange = minDate && maxDate && 
        from.getTime() === minDate.getTime() && 
        to.getTime() === maxDate.getTime();

      const startStr = isDefaultRange ? null : format(from, 'yyyy-MM-dd');
      const endStr = isDefaultRange ? null : format(to, 'yyyy-MM-dd 23:59:59');

      const [
        statsBuffer,
        trendBuffer,
        offencesBuffer,
        stationsBuffer,
        vehicleBuffer
      ] = await Promise.all([
        executeQuery(QUERIES.getExecutiveSummaryStats(startStr, endStr)),
        executeQuery(QUERIES.getDailyVolumeTrend(startStr, endStr)),
        executeQuery(QUERIES.getTopOffencesList(startStr, endStr)),
        executeQuery(QUERIES.getTopStationsList(startStr, endStr)),
        executeQuery(QUERIES.getVehicleMix(startStr, endStr))
      ]);

      set({
        stats: parseArrowBuffer(statsBuffer),
        dailyTrend: parseArrowBuffer(trendBuffer),
        topOffences: parseArrowBuffer(offencesBuffer),
        topStations: parseArrowBuffer(stationsBuffer),
        vehicleMix: parseArrowBuffer(vehicleBuffer),
        isLoading: false
      });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  }
}));
