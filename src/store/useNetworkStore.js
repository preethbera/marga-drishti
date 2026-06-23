import { create } from 'zustand';
import { executeQuery } from '../core/engine/queryClient';
import { QUERIES } from '../core/engine/queries';
import { parseArrowBuffer } from '../core/arrow/arrowParsers';
import { runSimulation } from '../core/engine/simulation';

export const useNetworkStore = create((set, get) => ({
  // Filters
  startDate: '',
  endDate: '',
  defaultStartDate: '',
  defaultEndDate: '',
  isDateRangeLoaded: false,
  roadClasses: [], // Empty means all
  
  // UI State
  selectedSegmentId: null,
  isFetching: false,
  error: null,
  
  // Raw Data
  networkData: null,
  
  // Processed Data
  processedSegments: [],
  networkKPIs: {
    totalSegments: 0,
    avgCapacityLoss: 0,
    criticalSegments: 0,
    totalPCUBlocked: 0
  },

  // Actions
  setFilters: (filters) => {
    set({ ...filters });
    get().fetchData();
  },

  toggleRoadClass: (roadClass) => {
    const current = get().roadClasses;
    if (current.includes(roadClass)) {
      set({ roadClasses: current.filter(c => c !== roadClass) });
    } else {
      set({ roadClasses: [...current, roadClass] });
    }
    // Reprocess locally without refetching
    get().processData();
  },

  clearFilters: () => {
    set({ 
      startDate: get().defaultStartDate,
      endDate: get().defaultEndDate,
      roadClasses: []
    });
    get().fetchData();
  },

  setSelectedSegment: (id) => {
    set({ selectedSegmentId: id });
  },

  fetchData: async () => {
    set({ isFetching: true, error: null });
    try {
      if (!get().isDateRangeLoaded) {
        const dateSql = QUERIES.getNetworkDateRange();
        const dateBuffer = await executeQuery(dateSql);
        const dateData = parseArrowBuffer(dateBuffer);
        
        let sDate = '2023-11-01';
        let eDate = '2023-11-30';
        if (dateData?.min_date?.length > 0) {
          // Parse BigInt timestamp
          const minTs = Number(dateData.min_date[0]) / 1000; 
          const maxTs = Number(dateData.max_date[0]) / 1000;
          sDate = new Date(minTs).toISOString().split('T')[0];
          eDate = new Date(maxTs).toISOString().split('T')[0];
        }

        set({ 
          startDate: sDate, 
          endDate: eDate, 
          defaultStartDate: sDate, 
          defaultEndDate: eDate,
          isDateRangeLoaded: true 
        });
      }

      const { startDate, endDate } = get();
      const sql = QUERIES.getNetworkIntelligenceData({ startDate, endDate });
      const buffer = await executeQuery(sql);
      const parsedData = parseArrowBuffer(buffer);
      
      set({ networkData: parsedData, isFetching: false });
      get().processData();
    } catch (error) {
      console.error("Failed to load network intelligence data:", error);
      set({ isFetching: false, error: error.message });
    }
  },

  processData: () => {
    const { networkData, roadClasses } = get();
    if (!networkData) return;
    
    const processed = [];
    let sumLossWeight = 0;
    let sumLength = 0;
    let criticalCount = 0;
    let totalPCU = 0;

    const len = networkData.code?.length || 0;
    for (let i = 0; i < len; i++) {
      const rawPcu = networkData.total_pcu[i] || 0;
      const violationCount = networkData.violation_count[i] || 0;

      // Only highlight segments that have at least one violation mapped
      if (violationCount === 0) continue;

      const rClass = networkData.road_class[i] || 'local';
      
      // Filter by road class
      if (roadClasses.length > 0 && !roadClasses.includes(rClass)) continue;

      const w_total = networkData.width[i] || 7.2;
      const length_m = networkData.length[i] || 100;
      let geom = null;
      if (networkData.geometry && networkData.geometry[i]) {
        try {
          geom = JSON.parse(networkData.geometry[i]);
        } catch (e) {
          // ignore
        }
      }

      // Temporal Aggregation: Average concurrent PCU
      const concurrentPCU = rawPcu;
      
      // Run the Greenberg Model for this segment
      const sim = runSimulation(w_total, concurrentPCU, 40);

      processed.push({
        id: networkData.code[i],
        road_class: rClass,
        width: w_total,
        length: length_m,
        lanes: networkData.lanes?.[i] || 2,
        geometry: geom,
        rawPCU: rawPcu,
        concurrentPCU: concurrentPCU,
        violationCount: violationCount,
        w_eff: sim.W_eff,
        k_j_base: sim.K_j_base,
        k_j_eff: sim.K_j_eff,
        capacityLoss: sim.capacityLostPercent,
        maxPCU: sim.maxPCU
      });

      // KPI Aggregation
      sumLossWeight += sim.capacityLostPercent * length_m;
      sumLength += length_m;
      totalPCU += concurrentPCU;
      if (sim.capacityLostPercent > 50) {
        criticalCount++;
      }
    }

    set({ 
      processedSegments: processed,
      networkKPIs: {
        totalSegments: processed.length,
        avgCapacityLoss: sumLength > 0 ? sumLossWeight / sumLength : 0,
        criticalSegments: criticalCount,
        totalPCUBlocked: totalPCU
      }
    });
  }
}));
