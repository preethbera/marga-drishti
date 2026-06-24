import React, { useState, useMemo } from 'react';
import { useNetworkStore } from '@/store/useNetworkStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { runSimulation, calculateEffectiveWidth } from '@/core/engine/simulation';
import Latex from "react-latex-next";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceDot, CartesianGrid } from 'recharts';

const getDisplayClass = (rc) => {
  if (rc === 'arterial') return 'Arterial';
  if (rc === 'sub_arterial') return 'Sub-Arterial';
  if (rc === 'collector') return 'Collector';
  return 'Local';
};

export default function SegmentInspector() {
  const { selectedSegmentId, processedSegments } = useNetworkStore();
  const [referenceDensity, setReferenceDensity] = useState([40]); // K

  const segment = processedSegments.find(s => s.id === selectedSegmentId);

  const currentK = Array.isArray(referenceDensity) ? referenceDensity[0] : referenceDensity;

  const stats = useMemo(() => {
    if (!segment) return null;
    return runSimulation(segment.width, segment.concurrentPCU, currentK);
  }, [segment, currentK]);

  const chartData = useMemo(() => {
    if (!segment || !stats) return [];
    const data = [];
    // Generate mini curve up to 150 density
    const maxK = 150;
    const step = 2;
    for (let k = step; k <= maxK; k += step) {
      const v = runSimulation(segment.width, segment.concurrentPCU, k).V;
      data.push({
        density: k,
        speed: Math.max(0, v)
      });
    }
    return data;
  }, [segment, stats]);

  if (!segment) {
    return (
      <Card className="h-full flex flex-col items-center justify-center text-center p-6 border-dashed">
        <div className="text-muted-foreground mb-2">No segment selected</div>
        <p className="text-sm text-muted-foreground">Click on a road segment on the map to view its detailed capacity breakdown.</p>
        <p className="text-sm text-muted-foreground mt-4 bg-muted/50 p-3 rounded-lg border border-border">Note: We are only highlighting the segments having at least one violation.</p>
      </Card>
    );
  }

  const isJam = stats.V <= 0;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Segment {segment.id}</CardTitle>
          <span className="text-xs font-medium bg-muted px-2 py-1 rounded">
            {getDisplayClass(segment.road_class)}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          {segment.lanes} lanes · {segment.length.toLocaleString()}m
        </p>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-y-auto space-y-4">
        {/* Width Stats */}
        <div className="grid grid-cols-3 gap-2 text-center text-sm">
          <div className="bg-muted/50 rounded p-2 border">
            <div className="text-muted-foreground text-xs mb-1">Total Width</div>
            <div className="font-semibold">{segment.width.toFixed(1)}m</div>
          </div>
          <div className="bg-destructive/10 text-destructive rounded p-2 border border-destructive/20">
            <div className="text-xs mb-1">Blocked</div>
            <div className="font-semibold">{(segment.width - stats.W_eff).toFixed(1)}m</div>
          </div>
          <div className="bg-primary/10 text-primary rounded p-2 border border-primary/20">
            <div className="text-xs mb-1">Effective</div>
            <div className="font-semibold">{stats.W_eff.toFixed(1)}m</div>
          </div>
        </div>

        {/* Capacity Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1 pl-3">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              Base Capacity
            </span>
            <span className="text-xs text-muted-foreground">(<Latex>{String.raw`$K_{j,base}$`}</Latex>)</span>
            <span className="font-mono">{Math.round(stats.K_j_base)} veh/km</span>
          </div>
          <div className="flex flex-col gap-1 border-l-2 pl-3">
            <span className="text-xs text-muted-foreground">
              Effective Jam Density
            </span>
            <span className="text-xs text-muted-foreground">(<Latex>{String.raw`$K_{j,eff}$`}</Latex>)</span>
            <span className="font-mono text-primary">{Math.round(stats.K_j_eff)} veh/km</span>
          </div>
        </div>

        {/* Capacity Reduction */}
        <div className="bg-card border rounded-lg p-4 flex items-center justify-between">
          <span className="text-sm font-medium">Capacity Reduction</span>
          <span className={`text-lg font-bold ${stats.capacityLostPercent > 50 ? 'text-destructive' : 'text-chart-2'}`}>
            {stats.capacityLostPercent.toFixed(1)}%
          </span>
        </div>

        {/* Reference Density Slider */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Reference Density (<Latex>{String.raw`$K$`}</Latex>)</span>
            <span className="text-sm font-mono bg-muted px-2 py-0.5 rounded">{currentK} veh/km</span>
          </div>
          <Slider
            value={Array.isArray(referenceDensity) ? referenceDensity : [referenceDensity]}
            onValueChange={setReferenceDensity}
            max={150}
            min={1}
            step={1}
            className="w-full"
          />
        </div>

        {/* Speed Result */}
        <div className="bg-card border rounded-lg p-4 flex items-center justify-between">
          <span className="text-sm font-medium">Predicted Speed (<Latex>{String.raw`$V$`}</Latex>)</span>
          {isJam ? (
            <div className={`text-lg font-bold text-destructive`}>TRAFFIC JAM</div>
          ) : (
            <span className={`text-lg font-bold text-chart-2`}>
              {stats.V.toFixed(1)} <span className="text-xl font-medium text-muted-foreground">km/h</span>
            </span>
          )}
        </div>

        {/* Mini Speed Density Curve */}
        <div className="h-48 mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
              <XAxis 
                dataKey="density" 
                type="number"
                domain={[0, 70]}
                stroke="#666" 
                fontSize={11} 
                tickLine={false}
              />
              <YAxis 
                stroke="#666" 
                fontSize={11} 
                domain={[0, 70]} 
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e1e1e', borderColor: '#333' }}
                itemStyle={{ color: '#fff' }}
                labelFormatter={(v) => `Density: ${v} veh/km`}
                formatter={(v) => [`${v.toFixed(1)} km/h`, 'Predicted Speed']}
              />
              <Line 
                type="monotone" 
                dataKey="speed" 
                stroke="var(--color-chart-1)" 
                strokeWidth={3}
                dot={false}
                isAnimationActive={false}
              />
              <ReferenceDot 
                x={currentK} 
                y={Math.max(0, stats.V)} 
                r={6} 
                fill="var(--color-chart-2)" 
                stroke="var(--background)" 
                strokeWidth={2} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

      </CardContent>
    </Card>
  );
}
