import React, { useEffect } from 'react';
import { useDataStore } from '@/store/useDataStore';
import { useNetworkStore } from '@/store/useNetworkStore';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';

// Components
import NetworkFilterBar from '@/components/network/NetworkFilterBar';
import NetworkKPIStrip from '@/components/network/NetworkKPIStrip';
import CapacityMap from '@/components/network/CapacityMap';
import SegmentInspector from '@/components/network/SegmentInspector';
import NetworkBreakdowns from '@/components/network/NetworkBreakdowns';
import RankedSegmentsTable from '@/components/network/RankedSegmentsTable';

export default function NetworkIntelligence() {
  const { isEngineReady, error: dataError, syncMessage, initializeDataEngine } = useDataStore();
  const { error: networkError } = useNetworkStore();

  useEffect(() => {
    initializeDataEngine();
  }, [initializeDataEngine]);

  const globalError = dataError || networkError;

  return (
    <div className="flex flex-col min-h-[calc(100vh-theme(spacing.16))] w-full m-0 p-6 bg-background animate-in fade-in duration-500">
      
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Congestion Analysis</h1>
        <p className="text-muted-foreground mt-1">Network-Wide Capacity Analysis using Dynamic Greenberg Model</p>
      </div>

      {/* Global Error State */}
      {globalError && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Computation Failed</AlertTitle>
          <AlertDescription>
            {globalError}. Please verify mounted datasets in Data Management.
          </AlertDescription>
        </Alert>
      )}

      {/* Loading Overlay */}
      {!isEngineReady && !globalError && (
        <div className="flex flex-col items-center justify-center py-20 border rounded-lg bg-card/50">
          <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
          <span className="text-lg font-medium text-foreground">Starting Analytical Engine...</span>
          <span className="text-sm text-muted-foreground mt-2">{syncMessage}</span>
        </div>
      )}

      {isEngineReady && (
        <div className="flex flex-col w-full">
          {/* Row A: Network Filter Bar */}
          <div className="mb-6">
            <NetworkFilterBar />
          </div>

          {/* Row B: Network KPI Strip */}
          <NetworkKPIStrip />

          {/* Row C: Capacity Map & Segment Inspector */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
            {/* Capacity Map (2/3 width) */}
            <div className="lg:col-span-8 flex flex-col min-h-[500px] bg-card rounded-lg border shadow-sm">
              <CapacityMap />
            </div>

            {/* Segment Inspector (1/3 width) */}
            <div className="lg:col-span-4 flex flex-col min-h-[500px]">
              <SegmentInspector />
            </div>
          </div>

          {/* Row D: Breakdowns */}
          <NetworkBreakdowns />

          {/* Row E: Ranked Segments Table */}
          <RankedSegmentsTable />
        </div>
      )}
    </div>
  );
}
