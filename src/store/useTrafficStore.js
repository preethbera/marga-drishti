import { create } from 'zustand';
import { executeQuery } from '../core/engine/queryClient';
import { QUERIES } from '../core/engine/queries';
import { parseArrowBuffer, extractFloat32Column } from '../core/arrow/arrowParsers';

export const useTrafficStore = create((set) => ({
  congestionData: null,
  violationSummary: null,
  segmentsData: null,
  isLoading: false,
  error: null,
  
  fetchCongestionData: async (startTime, endTime) => {
    set({ isLoading: true, error: null });
    try {
      const sql = QUERIES.getCongestionData(startTime, endTime);
      
      // Execute query through the web worker
      const buffer = await executeQuery(sql);
      
      // Pass the resulting buffer to arrowParsers
      const parsedData = parseArrowBuffer(buffer);
      
      // Store the extracted typed arrays in the Zustand state
      set({ congestionData: parsedData, isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },
  
  fetchViolationSummary: async () => {
    set({ isLoading: true, error: null });
    try {
      const sql = QUERIES.getViolationSummary();
      const buffer = await executeQuery(sql);
      
      const parsedData = parseArrowBuffer(buffer);
      
      set({ violationSummary: parsedData, isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },
  
  fetchSegments: async (boundingBox = null) => {
    set({ isLoading: true, error: null });
    try {
      const sql = QUERIES.getSegmentsWKB(boundingBox);
      const buffer = await executeQuery(sql);
      
      const parsedData = parseArrowBuffer(buffer);
      // Example of extracting a specific Float32Array column if needed:
      // const trafficLevels = extractFloat32Column(buffer, 'traffic_level');
      
      set({ segmentsData: parsedData, isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  }
}));
