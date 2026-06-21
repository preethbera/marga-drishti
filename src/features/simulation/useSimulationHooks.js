import { useMemo } from 'react';
import {
  MODEL_CONSTANTS,
  computeWeff,
  computeKjBase,
  computeKjEff,
  computeV,
  computeCapacityReduction,
  computeMaxPCU,
  computeGridlockPCU,
  computeSpeedLossAttribution,
  generateSpeedDensityCurve,
  generateSensitivityCurve
} from './modelEngine';

export function useSimulationDerived(W_total, PCU_parked, K) {
  return useMemo(() => {
    const W_eff = computeWeff(W_total, PCU_parked);
    const K_j_base = computeKjBase(W_total);
    const K_j_eff = computeKjEff(W_eff);
    const V = computeV(K, K_j_eff);
    const isGridlocked = K >= K_j_eff;
    const capacityReduction = computeCapacityReduction(K_j_base, K_j_eff);
    const maxPCU = computeMaxPCU(W_total);
    const gridlockPCU = computeGridlockPCU(W_total, K);
    const attribution = computeSpeedLossAttribution(W_total, PCU_parked, K);
    const effectiveLanes = W_eff / MODEL_CONSTANTS.PCU_WIDTH_M;
    const blockedWidth = PCU_parked * MODEL_CONSTANTS.PCU_WIDTH_M;
    const isNearMinWidth = W_eff <= MODEL_CONSTANTS.MIN_W_EFF + 0.5;
    
    return {
      W_eff,
      K_j_base,
      K_j_eff,
      V,
      isGridlocked,
      capacityReduction,
      maxPCU,
      gridlockPCU,
      attribution,
      effectiveLanes,
      blockedWidth,
      isNearMinWidth
    };
  }, [W_total, PCU_parked, K]);
}

export function useSpeedDensityCurves(W_total, PCU_parked, curvePCULevels) {
  return useMemo(() => {
    const allLevels = [...new Set([...curvePCULevels, PCU_parked])].sort((a, b) => a - b);
    return allLevels.map(pcu => ({
      pcu,
      isCurrent: pcu === PCU_parked,
      points: generateSpeedDensityCurve(W_total, pcu, MODEL_CONSTANTS.CURVE_DENSITY_POINTS)
    }));
  }, [W_total, PCU_parked, curvePCULevels]);
}

export function useSensitivityCurve(W_total, K) {
  return useMemo(
    () => generateSensitivityCurve(W_total, K, MODEL_CONSTANTS.SENSITIVITY_POINTS),
    [W_total, K]
  );
}
