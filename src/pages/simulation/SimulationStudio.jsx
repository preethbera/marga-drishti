import React from 'react';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';
import { useSimulationStore } from '@/store/useSimulationStore';
import { useDataStore } from '@/store/useDataStore';
import { Loader2 } from 'lucide-react';

import ControlPanel from '@/components/simulation/ControlPanel';
import DensitySpeedCurve from '@/components/simulation/DensitySpeedCurve';
import GridlockGauge from '@/components/simulation/GridlockGauge';
import SpeedLossAttribution from '@/components/simulation/SpeedLossAttribution';
import RoadCrossSection from '@/components/simulation/RoadCrossSection';
import SensitivitySweep from '@/components/simulation/SensitivitySweep';

// Import KaTeX CSS for math rendering
import 'katex/dist/katex.min.css';

export default function SimulationStudio() {
  const { resetToDefaults } = useSimulationStore();
  const { isEngineReady, syncMessage, initializeDataEngine } = useDataStore();

  React.useEffect(() => {
    initializeDataEngine();
  }, [initializeDataEngine]);

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-background p-6 space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Simulation Studio</h1>
          <p className="text-muted-foreground mt-1">
            Interactive macroscopic traffic model sandbox based on Greenberg equations.
          </p>
        </div>
        <Button variant="outline" onClick={resetToDefaults} className="shrink-0">
          <RotateCcw className="mr-2 h-4 w-4" /> Reset to Defaults
        </Button>
      </div>

      {/* Row 1: Control Panel (Full Width) */}
      <div className="w-full">
        <ControlPanel />
      </div>

      {/* Row 2: Top Graphs (70/30 Layout) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
        <div className="lg:col-span-8 flex flex-col min-h-[400px] bg-card rounded-lg border shadow-sm">
          <DensitySpeedCurve />
        </div>
        <div className="lg:col-span-4 flex flex-col min-h-[400px] bg-card rounded-lg border shadow-sm">
          <GridlockGauge />
        </div>
      </div>

      {/* Row 4: Bottom Graphs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="flex flex-col min-h-[400px] bg-card rounded-lg border shadow-sm">
          <SpeedLossAttribution />
        </div>
        <div className="flex flex-col min-h-[400px] bg-card rounded-lg border shadow-sm">
          <RoadCrossSection />
        </div>
      </div>

      {/* Full Width Bottom Row: Sensitivity Sweep */}
      <div className="w-full h-[400px]">
        <SensitivitySweep />
      </div>

      {/* Full-screen blocking loader only on initial mount before any data */}
      {!isEngineReady && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm transition-all print:hidden">
          <div className="flex flex-col items-center gap-2 bg-card p-6 rounded-lg shadow-lg border max-w-md text-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="text-sm font-medium">{syncMessage || 'Initializing Data Engine...'}</span>
          </div>
        </div>
      )}

    </div>
  );
}
