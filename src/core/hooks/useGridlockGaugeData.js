import { useSimulationStore } from '@core/store/useSimulationStore';
import { useSimulationDerived } from './useSimulationHooks';
import { SIMULATION_CHART_CONFIG } from '@features/simulation/simulationConfig';

export function useGridlockGaugeData() {
  const { K } = useSimulationStore();
  const derived = useSimulationDerived(useSimulationStore.getState().W_total, useSimulationStore.getState().PCU_parked, K);
  const { K_j_eff, isGridlocked } = derived;

  const validKj = K_j_eff > 1;
  const fillRatio = validKj ? Math.min(K / K_j_eff, 1.0) : 1.0;
  
  let arcColor = SIMULATION_CHART_CONFIG.gridlock.color;
  let zoneLabel = 'Gridlocked';
  
  if (validKj && !isGridlocked) {
    if (fillRatio < SIMULATION_CHART_CONFIG.riskZones.safe.threshold) {
      arcColor = SIMULATION_CHART_CONFIG.riskZones.safe.color;
      zoneLabel = SIMULATION_CHART_CONFIG.riskZones.safe.label;
    } else if (fillRatio < SIMULATION_CHART_CONFIG.riskZones.marginal.threshold) {
      arcColor = SIMULATION_CHART_CONFIG.riskZones.marginal.color;
      zoneLabel = SIMULATION_CHART_CONFIG.riskZones.marginal.label;
    } else {
      arcColor = SIMULATION_CHART_CONFIG.riskZones.critical.color;
      zoneLabel = SIMULATION_CHART_CONFIG.riskZones.critical.label;
    }
  }

  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const arcLength = circumference * 0.75;
  const strokeDasharray = `${arcLength} ${circumference}`;
  const strokeDashoffset = arcLength - (fillRatio * arcLength);
  const d = `M 43.43 156.57 A 80 80 0 1 1 156.57 156.57`;

  return {
    K,
    K_j_eff,
    isGridlocked,
    arcColor,
    zoneLabel,
    fillRatio,
    strokeDasharray,
    strokeDashoffset,
    d
  };
}
