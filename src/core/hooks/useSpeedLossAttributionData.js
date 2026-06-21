import { useSimulationStore } from '@core/store/useSimulationStore';
import { useSimulationDerived } from './useSimulationHooks';

export function useSpeedLossAttributionData() {
  const { W_total, PCU_parked, K } = useSimulationStore();
  const derived = useSimulationDerived(W_total, PCU_parked, K);
  const { attribution, isGridlocked } = derived;

  const barData = [{
    name: 'Speed Decomposition',
    remaining: attribution.V_actual,
    parkingLoss: attribution.parkingLoss,
    densityLoss: attribution.densityLoss,
  }];

  const pctDensity = ((attribution.densityLoss / attribution.V_F) * 100).toFixed(0);
  const pctParking = ((attribution.parkingLoss / attribution.V_F) * 100).toFixed(0);
  const pctTotal = ((attribution.totalLoss / attribution.V_F) * 100).toFixed(0);

  return {
    barData,
    pctDensity,
    pctParking,
    pctTotal,
    isGridlocked,
    attribution
  };
}
