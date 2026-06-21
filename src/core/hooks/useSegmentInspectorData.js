import { useNetworkAggregate, useSegmentDetail } from './useNetworkHooks';
import { useNetworkStore } from '@core/store/useNetworkStore';

export function useSegmentInspectorData() {
  const { data } = useNetworkAggregate();
  const { 
    selectedSegmentId, 
    referenceK, 
    setReferenceK,
    clearSelectedSegment,
    setCascadeOrigin
  } = useNetworkStore();

  const detail = useSegmentDetail(data, selectedSegmentId, referenceK);

  return {
    selectedSegmentId,
    detail,
    referenceK,
    setReferenceK,
    clearSelectedSegment,
    setCascadeOrigin
  };
}
