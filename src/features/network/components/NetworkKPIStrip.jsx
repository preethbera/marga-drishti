import React from 'react';
import { Card, CardContent } from '@components/ui/card';
import { Skeleton } from '@components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '@components/ui/alert';
import { Info } from 'lucide-react';
import { SIMULATION_CHART_CONFIG } from '../../simulation/simulationConfig';
import { MetricCard } from '@components/custom/MetricCard';
export function NetworkKPIStrip({
  isError,
  isEmpty,
  isLoading,
  kpis,
  unmatchedStr,
  avgColor
}) {
  if (isError) return null;

  if (isEmpty) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>No Segment Data Available</AlertTitle>
        <AlertDescription>
          No road segments match the current filters, or no segments dataset is loaded. Adjust your filters or visit Data Management.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
      <Card>
        <CardContent className="p-6 flex flex-col justify-between h-full">
          <p className="text-sm font-medium text-muted-foreground mb-2">Segments Analyzed</p>
          {isLoading ? (
            <Skeleton className="h-8 w-24 mb-2" />
          ) : (
            <p className="text-3xl font-bold">{kpis?.segmentCount?.toLocaleString()}</p>
          )}
          <p className="text-xs text-muted-foreground mt-2">{unmatchedStr}</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 flex flex-col justify-between h-full">
          <p className="text-sm font-medium text-muted-foreground mb-2">Network Avg Capacity Loss</p>
          {isLoading ? (
            <Skeleton className="h-8 w-24 mb-2" />
          ) : (
            <p className="text-3xl font-bold" style={{ color: avgColor }}>
              {kpis?.avgCapacityReduction?.toFixed(1)}%
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-2">Weighted by road length</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 flex flex-col justify-between h-full">
          <p className="text-sm font-medium text-muted-foreground mb-2">Critical Segments</p>
          {isLoading ? (
            <Skeleton className="h-8 w-24 mb-2" />
          ) : (
            <p className="text-3xl font-bold text-red-500">
              {kpis?.criticalCount?.toLocaleString()} <span className="text-lg font-normal text-muted-foreground">({((kpis?.criticalCount / kpis?.segmentCount) * 100 || 0).toFixed(1)}%)</span>
            </p>
          )}
          <div className="text-xs text-muted-foreground mt-2">
            {isLoading ? <Skeleton className="h-3 w-32" /> : `${(kpis?.criticalLength / 1000).toFixed(1)} km of road affected`}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 flex flex-col justify-between h-full">
          <p className="text-sm font-medium text-muted-foreground mb-2">Total PCU Blocked</p>
          {isLoading ? (
            <Skeleton className="h-8 w-24 mb-2" />
          ) : (
            <p className="text-3xl font-bold">
              {kpis?.totalPCUBlocked?.toFixed(0)}
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-2">Equivalent to roughly {kpis?.totalPCUBlocked?.toFixed(0)} standard cars</p>
        </CardContent>
      </Card>
    </div>
  );
}
