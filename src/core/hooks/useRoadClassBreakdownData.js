import { useNetworkAggregate, useRoadClassBreakdown } from './useNetworkHooks';
import { useNetworkStore } from '@core/store/useNetworkStore';

export function useRoadClassBreakdownData() {
  const { status, data } = useNetworkAggregate();
  const breakdown = useRoadClassBreakdown(data);
  const { toggleRoadClass, roadClassFilter } = useNetworkStore();

  const isHidden = status === 'error' || (status === 'empty' && (!data || data.length === 0));

  const handleBarClick = (entry) => {
    toggleRoadClass(entry.name);
  };

  return {
    isHidden,
    breakdown,
    roadClassFilter,
    handleBarClick
  };
}
