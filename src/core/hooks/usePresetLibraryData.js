import { useState, useEffect } from 'react';
import { AnalyticsService } from '@core/analytics/analytics.service';
import { useSimulationStore } from '@core/store/useSimulationStore';
import { useUiStore } from '@core/store/useUiStore';
import { getPCU } from '@core/simulation/modelEngine';

export const ARCHETYPAL_PRESETS = [
  { segment_id: 'archetype_1', name: 'Narrow Local Road', width_m: 5.0, road_class: 'local', lanes: 1 },
  { segment_id: 'archetype_2', name: 'Standard Two-Lane Arterial', width_m: 7.2, road_class: 'arterial', lanes: 2 },
  { segment_id: 'archetype_3', name: 'Wide Sub-Arterial', width_m: 10.0, road_class: 'sub_arterial', lanes: 3 },
  { segment_id: 'archetype_4', name: 'Wide Arterial / Boulevard', width_m: 14.0, road_class: 'arterial', lanes: 4 },
];

export function usePresetLibraryData() {
  const { applyPreset, selectedPresetId } = useSimulationStore();
  const isDataLoaded = useUiStore(state => state.isDataLoaded);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [presets, setPresets] = useState([]);
  const [loadViolationPCU, setLoadViolationPCU] = useState(false);
  const [fallbackToArchetypes, setFallbackToArchetypes] = useState(false);

  useEffect(() => {
    if (!isDataLoaded) return;
    
    async function fetchPresets() {
      setLoading(true);
      try {
        const segments = await AnalyticsService.getSegmentPresets();
        if (!segments || segments.length === 0) {
          setFallbackToArchetypes(true);
          setLoading(false);
          return;
        }

        const violations = await AnalyticsService.getSegmentWithViolationPCU();
        const segmentPCU = {};
        if (violations && violations.length > 0) {
          violations.forEach(v => {
            const seg = String(v.segment_id);
            const pcuValue = getPCU(v.vehicle_type) * v.c;
            segmentPCU[seg] = (segmentPCU[seg] || 0) + pcuValue;
          });
        }

        const enriched = segments.map(seg => ({
          ...seg,
          pcu_current: segmentPCU[seg.segment_id]
        }));
        
        setPresets(enriched);
      } catch (err) {
        console.error("Failed to load presets", err);
        setFallbackToArchetypes(true);
      } finally {
        setLoading(false);
      }
    }
    fetchPresets();
  }, [isDataLoaded]);

  const activePresets = fallbackToArchetypes ? ARCHETYPAL_PRESETS : presets;

  const handleSelect = (presetId) => {
    const p = activePresets.find(x => String(x.segment_id) === presetId);
    if (p) {
      applyPreset({
        segment_id: p.segment_id,
        W_total: p.width_m,
        PCU_parked: loadViolationPCU ? (p.pcu_current || 0) : 0,
        K: 20
      });
      setOpen(false);
    }
  };

  const selectedPresetObj = activePresets.find(p => String(p.segment_id) === String(selectedPresetId));

  return {
    open, setOpen,
    loading,
    presets,
    loadViolationPCU, setLoadViolationPCU,
    fallbackToArchetypes,
    activePresets,
    handleSelect,
    selectedPresetObj,
    selectedPresetId,
    isDataLoaded
  };
}
