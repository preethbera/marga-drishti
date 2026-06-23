import { create } from 'zustand';
import { executeQuery } from '../core/engine/queryClient';
import { QUERIES } from '../core/engine/queries';
import { parseArrowToTable } from '../core/arrow/arrowParsers';

export const useExploratoryStore = create((set, get) => ({
  xAxis: 'Vehicle Type',
  yAxis: 'Offence Code',
  pivotData: null, // Arrow Table
  isLoading: false,
  error: null,

  setAxes: (xAxis, yAxis) => {
    set({ xAxis, yAxis });
    get().generatePivot();
  },

  setXAxis: (xAxis) => {
    set({ xAxis });
    get().generatePivot();
  },

  setYAxis: (yAxis) => {
    set({ yAxis });
    get().generatePivot();
  },

  generatePivot: async () => {
    const { xAxis, yAxis } = get();
    
    // Prevent invalid self-referencing pivot
    if (xAxis === yAxis) {
      set({ error: 'X and Y axes cannot be the same', pivotData: null });
      return;
    }

    set({ isLoading: true, error: null });

    try {
      const sql = QUERIES.getExploratoryPivot(xAxis, yAxis);
      const buffer = await executeQuery(sql);
      const table = parseArrowToTable(buffer);
      
      set({ pivotData: table, isLoading: false });
    } catch (error) {
      console.error('Exploratory Sandbox Error:', error);
      set({ error: error.message, isLoading: false, pivotData: null });
    }
  }
}));
