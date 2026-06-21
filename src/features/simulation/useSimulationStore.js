import { create } from 'zustand';
import { MODEL_CONSTANTS, computeMaxPCU } from './modelEngine';

export const useSimulationStore = create((set, get) => ({
  W_total: MODEL_CONSTANTS.DEFAULT_W_TOTAL,
  PCU_parked: MODEL_CONSTANTS.DEFAULT_PCU,
  K: MODEL_CONSTANTS.DEFAULT_K,
  curvePCULevels: [0, 0.5, 1.0, 1.5, 2.0],
  selectedPresetId: null,

  setWTotal: (value) => {
    let W_clamped = Math.max(MODEL_CONSTANTS.W_MIN, Math.min(MODEL_CONSTANTS.W_MAX, value));
    
    set((state) => {
      const currentPCU = state.PCU_parked;
      const newMaxPCU = computeMaxPCU(W_clamped);
      let newPCU = currentPCU;
      
      if (currentPCU > newMaxPCU) {
        newPCU = newMaxPCU;
      }
      
      return {
        W_total: W_clamped,
        PCU_parked: newPCU
      };
    });
  },

  setPCUParked: (value) => {
    set((state) => {
      const maxPCU = computeMaxPCU(state.W_total);
      let clampedPCU = Math.max(0, Math.min(maxPCU, value));
      return { PCU_parked: clampedPCU };
    });
  },

  setK: (value) => {
    set({ K: Math.max(MODEL_CONSTANTS.K_MIN, Math.min(MODEL_CONSTANTS.K_MAX, value)) });
  },

  applyPreset: (preset) => {
    set((state) => {
      let W_val = Number(preset.width_m);
      if (isNaN(W_val) || W_val === 0) W_val = MODEL_CONSTANTS.DEFAULT_W_TOTAL;
      
      let W_clamped = Math.max(MODEL_CONSTANTS.W_MIN, Math.min(MODEL_CONSTANTS.W_MAX, W_val));
      let newPCU = state.PCU_parked;
      
      if (preset.pcu_current !== undefined && !isNaN(preset.pcu_current)) {
        const newMaxPCU = computeMaxPCU(W_clamped);
        newPCU = Math.min(Number(preset.pcu_current), newMaxPCU);
      }
      
      return {
        W_total: W_clamped,
        PCU_parked: newPCU,
        selectedPresetId: preset.segment_id
      };
    });
  },

  setSelectedPresetId: (id) => {
    set({ selectedPresetId: id });
  },

  addCurvePCULevel: (level) => {
    set((state) => {
      if (state.curvePCULevels.includes(level)) return state;
      const newLevels = [...state.curvePCULevels, level].sort((a, b) => a - b);
      return { curvePCULevels: newLevels };
    });
  },

  removeCurvePCULevel: (level) => {
    set((state) => {
      if (level === 0) return state; // Always keep 0
      return { curvePCULevels: state.curvePCULevels.filter((l) => l !== level) };
    });
  },

  resetSimulator: () => {
    set({
      W_total: MODEL_CONSTANTS.DEFAULT_W_TOTAL,
      PCU_parked: MODEL_CONSTANTS.DEFAULT_PCU,
      K: MODEL_CONSTANTS.DEFAULT_K,
      curvePCULevels: [0, 0.5, 1.0, 1.5, 2.0],
      selectedPresetId: null,
    });
  }
}));
