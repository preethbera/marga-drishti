import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { useSimulationStore } from '@core/store/useSimulationStore';
import { useSimulationDerived } from '@core/hooks/useSimulationHooks';
import { SIMULATION_CHART_CONFIG } from '../simulationConfig';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border border-border p-3 rounded shadow-md text-sm">
        {payload.map(entry => {
          // Hide bars with 0 width from tooltip unless we want to show them
          if (entry.value === 0 && entry.dataKey !== 'remaining') return null;
          let label = '';
          if (entry.dataKey === 'remaining') label = 'Predicted Speed';
          if (entry.dataKey === 'parkingLoss') label = 'Parking Loss';
          if (entry.dataKey === 'densityLoss') label = 'Density Loss';
          
          return (
            <div key={entry.dataKey} className="flex items-center gap-2 mb-1">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: entry.fill }} />
              <span className="font-medium">{label}:</span>
              <span>{entry.value.toFixed(1)} km/h</span>
            </div>
          );
        })}
      </div>
    );
  }
  return null;
};

export function SpeedLossAttribution({
  barData,
  pctDensity,
  pctParking,
  pctTotal,
  isGridlocked,
  attribution
}) {

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-0">
        <CardTitle className="text-lg">Speed Loss Attribution</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-center p-6">
        
        <div className="h-24 w-full relative">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} layout="vertical" margin={{ top: 20, right: 10, left: -20, bottom: 20 }}>
              <XAxis 
                type="number" 
                domain={[0, attribution.V_F]} 
                ticks={Array.from(new Set([0, attribution.V_actual, attribution.V_no_parking, attribution.V_F]))}
                tickFormatter={(v) => v.toFixed(0)}
                axisLine={false}
                tickLine={false}
                label={{ value: 'Speed (km/h)', position: 'insideBottom', offset: -10, fontSize: 12 }}
              />
              <YAxis type="category" dataKey="name" hide />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
              
              <Bar dataKey="remaining" stackId="a" fill={SIMULATION_CHART_CONFIG.attribution.remainingColor} isAnimationActive={true} />
              <Bar dataKey="parkingLoss" stackId="a" fill={SIMULATION_CHART_CONFIG.attribution.parkingColor} isAnimationActive={true} />
              <Bar dataKey="densityLoss" stackId="a" fill={SIMULATION_CHART_CONFIG.attribution.densityColor} isAnimationActive={true} />

              <ReferenceLine x={attribution.V_actual} stroke="currentColor" strokeDasharray="3 3" opacity={0.5} />
              <ReferenceLine x={attribution.V_no_parking} stroke="currentColor" strokeDasharray="3 3" opacity={0.5} />
              <ReferenceLine x={attribution.V_F} stroke="currentColor" strokeDasharray="3 3" opacity={0.5} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4 border border-border rounded-md bg-muted/20 text-sm overflow-hidden">
          <div className="grid grid-cols-2 p-2 border-b border-border bg-muted/40">
            <span className="text-muted-foreground">Free-Flow Speed (V_f)</span>
            <span className="text-right font-medium">{attribution.V_F.toFixed(1)} km/h</span>
          </div>
          <div className="grid grid-cols-2 p-2 border-b border-border">
            <span className="text-muted-foreground">Without parking (density only)</span>
            <span className="text-right">{attribution.V_no_parking.toFixed(1)} km/h</span>
          </div>
          <div className={`grid grid-cols-2 p-2 border-b-2 border-border ${isGridlocked ? 'bg-red-500/10' : ''}`}>
            <span className="font-semibold">With parking violations</span>
            <span className={`text-right font-bold ${isGridlocked ? 'text-red-500' : 'text-green-500'}`}>
              {isGridlocked ? '0 km/h (GRIDLOCKED)' : `${attribution.V_actual.toFixed(1)} km/h`}
            </span>
          </div>
          
          <div className="grid grid-cols-2 p-2 border-b border-border text-slate-500">
            <span>Density-induced loss</span>
            <span className="text-right">-{attribution.densityLoss.toFixed(1)} km/h ({pctDensity}%)</span>
          </div>
          <div className="grid grid-cols-2 p-2 border-b border-border text-red-500">
            <span>Parking-induced loss</span>
            <span className="text-right">-{attribution.parkingLoss.toFixed(1)} km/h ({pctParking}%)</span>
          </div>
          <div className="grid grid-cols-2 p-2 font-semibold bg-muted/30">
            <span>Total speed reduction</span>
            <span className="text-right">-{attribution.totalLoss.toFixed(1)} km/h ({pctTotal}%)</span>
          </div>
        </div>

      </CardContent>
    </Card>
  );
}
