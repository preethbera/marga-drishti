import React from 'react';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';
import { useSimulationStore } from './useSimulationStore';
import { PresetLibrary } from './components/PresetLibrary';
import { ControlPanel } from './components/ControlPanel';
import { SpeedDensityCurves } from './components/SpeedDensityCurves';
import { GridlockGauge } from './components/GridlockGauge';
import { SpeedLossAttribution } from './components/SpeedLossAttribution';
import { RoadCrossSection } from './components/RoadCrossSection';
import { SensitivitySweep } from './components/SensitivitySweep';

export default function SimulationStudio() {
  const { resetSimulator } = useSimulationStore();

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
        <PresetLibrary />
      </div>

      {/* ROW B: Control Panel (Sliders & Metrics) */}
      <div className="w-full">
        <ControlPanel />
      </div>

      {/* ROW C: Curves (60%) & Gauge (40%) */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <SpeedDensityCurves />
        </div>
        <div className="lg:col-span-2">
          <GridlockGauge />
        </div>
      </div>

      {/* ROW D: Attribution (50%) & Cross-Section (50%) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="col-span-1">
          <SpeedLossAttribution />
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
