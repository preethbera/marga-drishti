import React from 'react';
import { useNetworkStore } from '@/store/useNetworkStore';
import { Card, CardContent } from '@/components/ui/card';
import { Layers, Activity, AlertTriangle, CarFront } from 'lucide-react';
import { Loader2 } from 'lucide-react';

export default function NetworkKPIStrip() {
  const { networkKPIs, isFetching, networkData } = useNetworkStore();

  if (isFetching || !networkData) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse bg-card/50">
            <CardContent className="p-6 h-[104px] flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Calculate colors for capacity loss
  const lossColorClass = 
    networkKPIs.avgCapacityLoss > 50 ? 'text-destructive' : 
    networkKPIs.avgCapacityLoss > 20 ? 'text-chart-4' : 
    'text-chart-2';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between space-y-0 pb-2">
            <p className="text-sm font-medium text-muted-foreground">Segments Analyzed</p>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex flex-col">
            <div className="text-2xl font-bold">{networkKPIs.totalSegments.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Currently in scope
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between space-y-0 pb-2">
            <p className="text-sm font-medium text-muted-foreground">Network Avg Capacity Loss</p>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex flex-col">
            <div className={`text-2xl font-bold ${lossColorClass}`}>
              {networkKPIs.avgCapacityLoss.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Weighted by road length
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between space-y-0 pb-2">
            <p className="text-sm font-medium text-muted-foreground">Critical Segments</p>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </div>
          <div className="flex flex-col">
            <div className="text-2xl font-bold text-destructive">
              {networkKPIs.criticalSegments.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              &gt;50% capacity reduction
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between space-y-0 pb-2">
            <p className="text-sm font-medium text-muted-foreground">Total PCU Blocked</p>
            <CarFront className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex flex-col">
            <div className="text-2xl font-bold">
              {Math.round(networkKPIs.totalPCUBlocked).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Average concurrent blockage
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
