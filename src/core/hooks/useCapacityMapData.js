import { useMemo } from 'react';
import { useNetworkAggregate, useCongestionCascade, useAdjacencyList } from '@core/hooks/useNetworkHooks';
import { useNetworkStore } from '@core/store/useNetworkStore';

export function useCapacityMapData() {
  const { status, data } = useNetworkAggregate();
  const adjacencyMap = useAdjacencyList();
  
  const { 
    cascadeOriginSegmentId,
    cascadeMaxHops,
    cascadeDecayFactor
  } = useNetworkStore();

  const cascadeSegments = useCongestionCascade(
    adjacencyMap, 
    data, 
    cascadeOriginSegmentId, 
    cascadeMaxHops, 
    cascadeDecayFactor
  );

  const cascadeSet = useMemo(() => new Set(cascadeSegments.map(c => c.segmentId)), [cascadeSegments]);

  const geoJsonFeatures = useMemo(() => {
    if (!data || data.length === 0) return { features: [], cascadeSet, cascadeSegments };

    const features = data
      .filter(seg => seg.capacityReduction > 0 || seg.segment_id === cascadeOriginSegmentId)
      .map(seg => ({
        type: 'Feature',
        geometry: typeof seg.geometry === 'string' ? JSON.parse(seg.geometry) : seg.geometry,
        properties: {
          ...seg
        }
      }));
      
    return { features, cascadeSet, cascadeSegments };
  }, [data, cascadeOriginSegmentId, cascadeSet, cascadeSegments]);

  return { 
    status, 
    features: geoJsonFeatures.features,
    cascadeSet: geoJsonFeatures.cascadeSet,
    cascadeSegments: geoJsonFeatures.cascadeSegments,
    cascadeOriginSegmentId
  };
}
