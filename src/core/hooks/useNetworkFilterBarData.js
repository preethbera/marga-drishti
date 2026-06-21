import { useNetworkStore } from '@core/store/useNetworkStore';

export function useNetworkFilterBarData() {
  const { 
    timeWindowStart, 
    timeWindowEnd, 
    setTimeWindow,
    roadClassFilter,
    toggleRoadClass,
    resetNetworkFilters
  } = useNetworkStore();

  const handleTimePreset = (days) => {
    if (days === 0) {
      setTimeWindow(null, null);
      return;
    }
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    setTimeWindow(start.toISOString(), end.toISOString());
  };

  const isAllTime = !timeWindowStart && !timeWindowEnd;

  const isPresetActive = (days) => {
    if (days === 0) return isAllTime;
    if (isAllTime || !timeWindowStart) return false;
    const diffTime = Math.abs(new Date().getTime() - new Date(timeWindowStart).getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays === days;
  };

  return {
    isAllTime,
    isPresetActive,
    handleTimePreset,
    roadClassFilter,
    toggleRoadClass,
    resetNetworkFilters
  };
}
