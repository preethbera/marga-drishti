import { useState, useEffect, useMemo } from 'react';
import { AnalyticsService } from '@/services/analytics.service';
import { useNetworkStore } from './useNetworkStore';
import { useUiStore } from '@/store/useUiStore';
import { 
  getPCU, 
  computeWeff, 
  computeKjBase, 
  computeKjEff, 
  computeCapacityReduction, 
  computeV, 
  generateSpeedDensityCurve,
  MODEL_CONSTANTS
} from '../simulation/modelEngine';
import { SIMULATION_CHART_CONFIG } from '../simulation/simulationConfig';

// Simple WKB LineString parser
function parseWKB(wkbBuffer) {
  if (!wkbBuffer || wkbBuffer.length < 9) return null;
  const view = new DataView(wkbBuffer.buffer, wkbBuffer.byteOffset, wkbBuffer.byteLength);
  const isLittle = view.getUint8(0) === 1;
  const numPoints = view.getUint32(5, isLittle);
  const coordinates = [];
  for (let i = 0; i < numPoints; i++) {
    const x = view.getFloat64(9 + i * 16, isLittle);
    const y = view.getFloat64(9 + i * 16 + 8, isLittle);
    coordinates.push([x, y]);
  }
  return {
    type: 'LineString',
    coordinates
  };
}

export function useNetworkAggregate() {
  const isDataLoaded = useUiStore(state => state.isDataLoaded);
  const { timeWindowStart, timeWindowEnd, roadClassFilter } = useNetworkStore();
  
  const [result, setResult] = useState({
    status: 'loading', // 'loading' | 'success' | 'empty' | 'error'
    data: [],
    unmatchedCount: 0
  });

  useEffect(() => {
    if (!isDataLoaded) return;

    let isMounted = true;
    
    async function fetchData() {
      setResult(prev => ({ ...prev, status: 'loading' }));
      
      try {
        const { status, rawSegments, rawViolations } = await AnalyticsService.getNetworkAggregate(
          timeWindowStart, 
          timeWindowEnd, 
          roadClassFilter
        );

        if (!isMounted) return;

        if (status === 'error') {
          setResult({ status: 'error', data: [], unmatchedCount: 0 });
          return;
        }

        if (status === 'empty' || rawSegments.length === 0) {
          setResult({ status: 'empty', data: [], unmatchedCount: 0 });
          return;
        }

        // 1. Process violations into PCU per segment
        const segmentPCUMap = new Map();
        let unmatchedCount = 0;
        
        // Track valid segment IDs for fast lookup
        const validSegmentIds = new Set(rawSegments.map(s => s.segment_id));

        rawViolations.forEach(v => {
          if (v.segment_id === -1 || !validSegmentIds.has(v.segment_id)) {
            unmatchedCount += v.count;
            return;
          }
          
          const pcuVal = getPCU(v.vehicle_type) * v.count;
          if (!segmentPCUMap.has(v.segment_id)) {
            segmentPCUMap.set(v.segment_id, { pcu: 0, count: 0 });
          }
          const curr = segmentPCUMap.get(v.segment_id);
          curr.pcu += pcuVal;
          curr.count += v.count;
        });

        // 2. Map geometries and compute model metrics for all segments
        const processedData = rawSegments.map(seg => {
          const violInfo = segmentPCUMap.get(seg.segment_id) || { pcu: 0, count: 0 };
          const W_total = seg.width_m;
          const PCU_parked = violInfo.pcu;
          
          const W_eff = computeWeff(W_total, PCU_parked);
          const K_j_base = computeKjBase(W_total);
          const K_j_eff = computeKjEff(W_eff);
          const capacityReduction = computeCapacityReduction(K_j_base, K_j_eff);

          // Parse WKB geometry
          const geometry = parseWKB(seg.geometry) || seg.geometry;

          return {
            ...seg,
            geometry,
            PCU_parked,
            violationCount: violInfo.count,
            W_total,
            W_eff,
            K_j_base,
            K_j_eff,
            capacityReduction
          };
        });

        setResult({
          status: 'success',
          data: processedData,
          unmatchedCount
        });

      } catch (err) {
        if (isMounted) {
          console.error("Error in useNetworkAggregate", err);
          setResult({ status: 'error', data: [], unmatchedCount: 0 });
        }
      }
    }

    fetchData();

    return () => { isMounted = false; };
  }, [isDataLoaded, timeWindowStart, timeWindowEnd, roadClassFilter]);

  return result;
}

export function useNetworkKPIs(aggregateData) {
  return useMemo(() => {
    if (!aggregateData || aggregateData.length === 0) return null;

    let totalLength = 0;
    let weightedReductionSum = 0;
    let totalPCUBlocked = 0;
    
    let safeCount = 0;
    let marginalCount = 0;
    let criticalCount = 0;
    let criticalLength = 0;

    aggregateData.forEach(seg => {
      totalLength += seg.length_m;
      weightedReductionSum += (seg.capacityReduction * seg.length_m);
      totalPCUBlocked += seg.PCU_parked;

      const ratio = seg.capacityReduction / 100;
      if (ratio >= SIMULATION_CHART_CONFIG.riskZones.critical.threshold) {
        criticalCount++;
        criticalLength += seg.length_m;
      } else if (ratio >= SIMULATION_CHART_CONFIG.riskZones.marginal.threshold) {
        marginalCount++;
      } else {
        safeCount++;
      }
    });

    const avgCapacityReduction = totalLength > 0 ? (weightedReductionSum / totalLength) : 0;

    return {
      segmentCount: aggregateData.length,
      avgCapacityReduction,
      totalPCUBlocked,
      safeCount,
      marginalCount,
      criticalCount,
      criticalLength,
      totalLength
    };
  }, [aggregateData]);
}

export function useRoadClassBreakdown(aggregateData) {
  return useMemo(() => {
    if (!aggregateData) return [];

    const grouped = new Map();
    
    aggregateData.forEach(seg => {
      const cls = seg.road_class || 'Unknown';
      if (!grouped.has(cls)) {
        grouped.set(cls, { class: cls, count: 0, length: 0, weightedReductionSum: 0, pcu: 0 });
      }
      const g = grouped.get(cls);
      g.count++;
      g.length += seg.length_m;
      g.weightedReductionSum += (seg.capacityReduction * seg.length_m);
      g.pcu += seg.PCU_parked;
    });

    const result = Array.from(grouped.values()).map(g => ({
      name: g.class,
      count: g.count,
      length_km: g.length / 1000,
      totalPCU: g.pcu,
      avgCapacityReduction: g.length > 0 ? (g.weightedReductionSum / g.length) : 0
    }));

    return result.sort((a, b) => b.avgCapacityReduction - a.avgCapacityReduction);
  }, [aggregateData]);
}

export function useRankedSegments(aggregateData, sortColumn, sortDirection) {
  return useMemo(() => {
    if (!aggregateData) return [];
    
    const sorted = [...aggregateData].sort((a, b) => {
      let valA = a[sortColumn];
      let valB = b[sortColumn];
      
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();
      
      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    
    return sorted;
  }, [aggregateData, sortColumn, sortDirection]);
}

export function useSegmentDetail(aggregateData, selectedSegmentId, referenceK) {
  return useMemo(() => {
    if (!aggregateData || selectedSegmentId == null) return null;
    
    const seg = aggregateData.find(s => s.segment_id === selectedSegmentId);
    if (!seg) return { outOfScope: true };

    const V = computeV(referenceK, seg.K_j_eff);
    const isGridlocked = V === 0 && referenceK >= seg.K_j_eff;

    // Generate just one curve for the current PCU
    const curves = generateSpeedDensityCurve(seg.W_total, seg.PCU_parked, [seg.PCU_parked]);
    const curve = curves[0]; // the only curve

    return {
      ...seg,
      V,
      isGridlocked,
      curve
    };
  }, [aggregateData, selectedSegmentId, referenceK]);
}

export function useAdjacencyList() {
  const isDataLoaded = useUiStore(state => state.isDataLoaded);
  const [adjacencyMap, setAdjacencyMap] = useState(new Map());

  useEffect(() => {
    if (!isDataLoaded) return;
    
    AnalyticsService.getAdjacencyList().then(map => {
      setAdjacencyMap(map);
    });
  }, [isDataLoaded]);

  return adjacencyMap;
}

export function useCongestionCascade(adjacencyMap, aggregateData, originId, maxHops, decayFactor) {
  return useMemo(() => {
    if (!adjacencyMap || !aggregateData || originId == null) return [];
    
    const originSegment = aggregateData.find(s => s.segment_id === originId);
    if (!originSegment) return []; // Origin is filtered out

    const dataMap = new Map();
    aggregateData.forEach(s => dataMap.set(s.segment_id, s));

    const originCapacityReduction = originSegment.capacityReduction;
    
    const result = [];
    const visited = new Set([originId]);
    
    // Queue stores [segment_id, hopDistance]
    const queue = [[originId, 0]];
    
    while (queue.length > 0) {
      const [currentId, currentHop] = queue.shift();
      
      if (currentHop > 0) {
        const seg = dataMap.get(currentId);
        if (seg) {
          const cascadeWeight = originCapacityReduction * Math.pow(decayFactor, currentHop);
          result.push({
            segmentId: currentId,
            hopDistance: currentHop,
            cascadeWeight,
            capacityReduction: seg.capacityReduction,
            roadClass: seg.road_class
          });
        }
      }

      if (currentHop < maxHops) {
        const neighbors = adjacencyMap.get(currentId) || [];
        for (const neighborId of neighbors) {
          if (!visited.has(neighborId)) {
            visited.add(neighborId);
            queue.push([neighborId, currentHop + 1]);
          }
        }
      }
    }

    // Sort by cascadeWeight descending
    return result.sort((a, b) => b.cascadeWeight - a.cascadeWeight);
  }, [adjacencyMap, aggregateData, originId, maxHops, decayFactor]);
}
