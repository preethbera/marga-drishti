import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Slider } from '@components/ui/slider';
import { Label } from '@components/ui/label';
import { Badge } from '@components/ui/badge';
import { useNetworkStore } from '@core/store/useNetworkStore';
import { useNetworkAggregate, useAdjacencyList, useCongestionCascade } from '@core/hooks/useNetworkHooks';

export function CongestionCascade() {
  const { data } = useNetworkAggregate();
  const adjacencyMap = useAdjacencyList();
  const { 
    cascadeOriginSegmentId, 
    cascadeMaxHops, 
    cascadeDecayFactor,
    setCascadeMaxHops,
    setCascadeDecayFactor,
    clearCascadeOrigin,
    selectSegment
  } = useNetworkStore();

  const cascadeSegments = useCongestionCascade(
    adjacencyMap, 
    data, 
    cascadeOriginSegmentId, 
    cascadeMaxHops, 
    cascadeDecayFactor
  );

  if (!cascadeOriginSegmentId) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg">Structural Congestion Cascade</CardTitle>
        </CardHeader>
        <CardContent className="py-8 text-center text-muted-foreground">
          Choose a segment from the map, table, or detail inspector to trace its network connections.
        </CardContent>
      </Card>
    );
  }

  const originSegment = data?.find(s => s.segment_id === cascadeOriginSegmentId);
  if (!originSegment) {
    return (
      <Card className="w-full">
        <CardContent className="py-8 text-center text-muted-foreground">
          Origin segment is outside current filter scope. Clear and select another.
          <div className="mt-4">
            <Button variant="outline" onClick={clearCascadeOrigin}>Clear Cascade</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (cascadeSegments.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg">Structural Congestion Cascade</CardTitle>
        </CardHeader>
        <CardContent className="py-8 text-center text-muted-foreground">
          This segment has no recorded upstream connections in the network topology.
          <div className="mt-4">
            <Button variant="outline" onClick={clearCascadeOrigin}>Clear Cascade</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3 border-b border-border">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">Structural Congestion Cascade</CardTitle>
          <Button variant="ghost" size="sm" onClick={clearCascadeOrigin}>Clear Cascade</Button>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        
        {/* Controls */}
        <div className="flex flex-col md:flex-row gap-8 mb-6 bg-muted/20 p-4 rounded-md">
          <div className="flex-1 space-y-4">
            <div className="flex justify-between items-center">
              <Label className="text-sm font-semibold text-muted-foreground">Max Hops: {cascadeMaxHops}</Label>
            </div>
            <Slider 
              min={1} max={8} step={1} 
              value={[cascadeMaxHops]} 
              onValueChange={(val) => setCascadeMaxHops(Array.isArray(val) ? val[0] : val)} 
            />
          </div>
          
          <div className="flex-1 space-y-4">
            <div className="flex justify-between items-center">
              <Label className="text-sm font-semibold text-muted-foreground">Decay Factor: {cascadeDecayFactor.toFixed(2)}</Label>
            </div>
            <Slider 
              min={0.1} max={0.95} step={0.05} 
              value={[cascadeDecayFactor]} 
              onValueChange={(val) => setCascadeDecayFactor(Array.isArray(val) ? val[0] : val)} 
            />
          </div>
        </div>

        {/* Results */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="text-sm font-semibold">Origin Segment {cascadeOriginSegmentId}</h4>
            <Badge variant="destructive">Reduction: {originSegment.capacityReduction.toFixed(1)}%</Badge>
          </div>

          <div className="rounded-md border border-border overflow-hidden">
            <div className="max-h-64 overflow-y-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-muted text-muted-foreground sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-2">Connected Segment</th>
                    <th className="px-4 py-2">Road Class</th>
                    <th className="px-4 py-2">Hop Distance</th>
                    <th className="px-4 py-2 text-right">Own Capacity Loss</th>
                    <th className="px-4 py-2 text-right">Cascade Weight</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {cascadeSegments.map(row => (
                    <tr 
                      key={row.segmentId} 
                      className="hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => selectSegment(row.segmentId)}
                    >
                      <td className="px-4 py-2 font-medium">{row.segmentId}</td>
                      <td className="px-4 py-2">{row.roadClass}</td>
                      <td className="px-4 py-2">
                        <Badge variant="secondary" className="font-mono">{row.hopDistance}</Badge>
                      </td>
                      <td className="px-4 py-2 text-right text-muted-foreground">
                        {row.capacityReduction.toFixed(1)}%
                      </td>
                      <td className="px-4 py-2 text-right font-bold text-primary">
                        {row.cascadeWeight.toFixed(1)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Cascade Weight prioritizes segments that are both structurally close to the bottleneck and highly constrained themselves.
          </p>
        </div>

      </CardContent>
    </Card>
  );
}
