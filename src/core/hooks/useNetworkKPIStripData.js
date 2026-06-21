import { useNetworkAggregate, useNetworkKPIs } from './useNetworkHooks';
import { SIMULATION_CHART_CONFIG } from '@features/simulation/simulationConfig';

export function useNetworkKPIStripData() {
  const { status, data, unmatchedCount } = useNetworkAggregate();
  const kpis = useNetworkKPIs(data);

  const isLoading = status === 'loading';
  const isEmpty = status === 'empty' && (!data || data.length === 0);
  const isError = status === 'error';

  let avgColor = SIMULATION_CHART_CONFIG.riskZones.safe.color;
  if (kpis && kpis.avgCapacityReduction >= SIMULATION_CHART_CONFIG.riskZones.critical.threshold * 100) {
    avgColor = SIMULATION_CHART_CONFIG.riskZones.critical.color;
  } else if (kpis && kpis.avgCapacityReduction >= SIMULATION_CHART_CONFIG.riskZones.marginal.threshold * 100) {
    avgColor = SIMULATION_CHART_CONFIG.riskZones.marginal.color;
  }

  const unmatchedStr = unmatchedCount > 0 
    ? `${unmatchedCount} violations could not be matched to a segment.` 
    : `All mapped successfully.`;

  return {
    isError,
    isEmpty,
    isLoading,
    kpis,
    unmatchedStr,
    avgColor
  };
}
