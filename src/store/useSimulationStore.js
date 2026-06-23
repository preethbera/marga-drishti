import { create } from 'zustand';
import { executeQuery } from '../core/engine/queryClient';
import { QUERIES } from '../core/engine/queries';
import { parseArrowBuffer } from '../core/arrow/arrowParsers';
import { runSimulation } from '../core/engine/simulation';

export const useSimulationStore = create((set, get) => ({
  // Inputs
  roadWidth: 7.2,
  parkedPCU: 0,
  trafficDensity: 40,
  
  // App state
  isRecalculating: false,

  // Outputs (derived)
  results: runSimulation(7.2, 0, 40),

  // Actions
  setInputs: (inputs) => {
    const current = get();
    const w = inputs.roadWidth ?? current.roadWidth;
    const p = inputs.parkedPCU ?? current.parkedPCU;
    const k = inputs.trafficDensity ?? current.trafficDensity;
    
    set({
      roadWidth: w,
      parkedPCU: p,
      trafficDensity: k,
      results: runSimulation(w, p, k)
    });
  },

  resetToDefaults: () => {
    set({
      roadWidth: 7.2,
      parkedPCU: 0,
      trafficDensity: 40,
      results: runSimulation(7.2, 0, 40)
    });
  }
}));
