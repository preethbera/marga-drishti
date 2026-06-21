import React from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { TriangleAlert } from 'lucide-react';
import { NetworkFilterBar } from '@/features/network/components/NetworkFilterBar';
import { NetworkKPIStrip } from '@/features/network/components/NetworkKPIStrip';
import { CapacityMap } from '@/features/network/components/CapacityMap';
import { SegmentInspector } from '@/features/network/components/SegmentInspector';
import { RoadClassBreakdown } from '@/features/network/components/RoadClassBreakdown';
import { CapacityRiskDistribution } from '@/features/network/components/CapacityRiskDistribution';
import { CongestionCascade } from '@/features/network/components/CongestionCascade';
import { RankedSegmentsTable } from '@/features/network/components/RankedSegmentsTable';
import { useNetworkAggregate } from '@/features/network/useNetworkHooks';

export default function NetworkIntelligence() {
  const { status } = useNetworkAggregate();

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6">
      
      {/* PAGE HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Network Capacity Intelligence</h1>
          <p className="text-muted-foreground text-sm">
            Marga-Drishti · Bengaluru Traffic Police · Dynamic Greenberg Model
          </p>
        </div>
      </div>

      {/* Global Error State */}
      {status === 'error' && (
        <Alert variant="destructive" className="mb-6">
          <TriangleAlert className="h-4 w-4" />
          <AlertTitle>Computation Failed</AlertTitle>
          <AlertDescription>
            Unable to compute network capacity data. Verify that segments and violations datasets are mounted in Data Management.
          </AlertDescription>
        </Alert>
      )}

      {/* ROW A: Filter Bar */}
      <NetworkFilterBar />

      {/* ROW B: KPI Strip */}
      <NetworkKPIStrip />

      {/* ROW C: Map & Inspector */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <CapacityMap />
        </div>
        <div>
          <SegmentInspector />
        </div>
      </div>

      {/* ROW D: Breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RoadClassBreakdown />
        <CapacityRiskDistribution />
      </div>

      {/* ROW E: Congestion Cascade */}
      <CongestionCascade />

      {/* ROW F: Ranked Table */}
      <RankedSegmentsTable />
      
    </div>
  );
}
