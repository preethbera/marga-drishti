import { useNetworkAggregate, useNetworkKPIs } from './useNetworkHooks';
import { SIMULATION_CHART_CONFIG } from '@features/simulation/simulationConfig';

export function useCapacityRiskDistributionData() {
  const { status, data } = useNetworkAggregate();
  const kpis = useNetworkKPIs(data);

  const isHidden = status === 'error' || (status === 'empty' && (!data || data.length === 0));

  const chartData = [
    { 
      name: 'Safe (<20% loss)', 
      value: kpis?.safeCount || 0, 
      length_km: ((kpis?.totalLength || 0) - (kpis?.criticalLength || 0)) / 1000,
      color: SIMULATION_CHART_CONFIG.riskZones.safe.color 
    },
    { 
      name: 'Marginal (20-50% loss)', 
      value: kpis?.marginalCount || 0, 
      length_km: 0, 
      color: SIMULATION_CHART_CONFIG.riskZones.marginal.color 
    },
    { 
      name: 'Critical (>50% loss)', 
      value: kpis?.criticalCount || 0, 
      length_km: (kpis?.criticalLength || 0) / 1000,
      color: SIMULATION_CHART_CONFIG.riskZones.critical.color 
    }
  ].filter(d => d.value > 0);

  return {
    isHidden,
    chartData
  };
}
