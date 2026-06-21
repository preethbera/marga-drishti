import React from 'react';
import { Button } from '@components/ui/button';
import { RotateCcw } from 'lucide-react';
import { useSimulationStore } from '@core/store/useSimulationStore';
import { useGridlockGaugeData } from '@core/hooks/useGridlockGaugeData';
import { useSpeedLossAttributionData } from '@core/hooks/useSpeedLossAttributionData';
import { useControlPanelData } from '@core/hooks/useControlPanelData';
import { usePresetLibraryData } from '@core/hooks/usePresetLibraryData';
import { 
  PresetLibrary, 
  ControlPanel, 
  SpeedDensityCurves, 
  GridlockGauge, 
  SpeedLossAttribution, 
  RoadCrossSection, 
  SensitivitySweep 
} from '@features/simulation';

export default function SimulationStudio() {
  const { resetSimulator } = useSimulationStore();
  const gaugeData = useGridlockGaugeData();
  const attributionData = useSpeedLossAttributionData();
  const controlData = useControlPanelData();
  const presetData = usePresetLibraryData();

  return (
    <div className="flex flex-col w-full h-full p-4 md:p-6 lg:p-8 space-y-6 overflow-y-auto bg-background/50">
      
      {/* PAGE HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-border pb-4 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Simulation Studio</h1>
          <p className="text-muted-foreground mt-1">Interactive macroscopic traffic model sandbox based on Greenberg equations.</p>
        </div>
        <Button variant="outline" onClick={resetSimulator} className="flex items-center gap-2">
          <RotateCcw className="h-4 w-4" />
          Reset to Defaults
        </Button>
      </div>

      {/* ROW A: Preset Library */}
      <div className="w-full">
        <PresetLibrary 
          open={presetData.open} setOpen={presetData.setOpen}
          loading={presetData.loading}
          loadViolationPCU={presetData.loadViolationPCU} setLoadViolationPCU={presetData.setLoadViolationPCU}
          fallbackToArchetypes={presetData.fallbackToArchetypes}
          activePresets={presetData.activePresets}
          handleSelect={presetData.handleSelect}
          selectedPresetObj={presetData.selectedPresetObj}
          selectedPresetId={presetData.selectedPresetId}
          isDataLoaded={presetData.isDataLoaded}
        />
      </div>

      {/* ROW B: Control Panel (Sliders & Metrics) */}
      <div className="w-full">
        <ControlPanel 
          W_total={controlData.W_total} PCU_parked={controlData.PCU_parked} K={controlData.K} 
          setWTotal={controlData.setWTotal} setPCUParked={controlData.setPCUParked} setK={controlData.setK}
          derived={controlData.derived}
          handleWTotalChange={controlData.handleWTotalChange} handlePCUChange={controlData.handlePCUChange} handleKChange={controlData.handleKChange}
          handleInputBlur={controlData.handleInputBlur} handleKeyDown={controlData.handleKeyDown}
          speedColor={controlData.speedColor} widthColor={controlData.widthColor} capacityColor={controlData.capacityColor}
        />
      </div>

      {/* ROW C: Curves (60%) & Gauge (40%) */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <SpeedDensityCurves />
        </div>
        <div className="lg:col-span-2">
          <GridlockGauge 
            K={gaugeData.K}
            K_j_eff={gaugeData.K_j_eff}
            isGridlocked={gaugeData.isGridlocked}
            arcColor={gaugeData.arcColor}
            zoneLabel={gaugeData.zoneLabel}
            fillRatio={gaugeData.fillRatio}
            strokeDasharray={gaugeData.strokeDasharray}
            strokeDashoffset={gaugeData.strokeDashoffset}
            d={gaugeData.d}
          />
        </div>
      </div>

      {/* ROW D: Attribution (50%) & Cross-Section (50%) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="col-span-1">
          <SpeedLossAttribution 
            barData={attributionData.barData}
            pctDensity={attributionData.pctDensity}
            pctParking={attributionData.pctParking}
            pctTotal={attributionData.pctTotal}
            isGridlocked={attributionData.isGridlocked}
            attribution={attributionData.attribution}
          />
        </div>
        <div className="col-span-1">
          <RoadCrossSection />
        </div>
      </div>

      {/* ROW E: Sensitivity Sweep */}
      <div className="w-full pb-10">
        <SensitivitySweep />
      </div>

    </div>
  );
}
