import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useNetworkAggregate, useRoadClassBreakdown } from '../useNetworkHooks';
import { useNetworkStore } from '../useNetworkStore';
import { interpolateColor } from '../networkConfig';
import { SIMULATION_CHART_CONFIG } from '../../simulation/simulationConfig';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-background border border-border p-3 rounded shadow-md text-sm">
        <p className="font-bold mb-1">{data.name}</p>
        <p>Avg Capacity Loss: <span className="font-semibold">{data.avgCapacityReduction.toFixed(1)}%</span></p>
        <p className="text-muted-foreground mt-1">Segments: {data.count}</p>
        <p className="text-muted-foreground">Total PCU Blocked: {data.totalPCU.toFixed(0)}</p>
        <p className="text-muted-foreground">Total Length: {data.length_km.toFixed(1)} km</p>
      </div>
    );
  }
  return null;
};

export function RoadClassBreakdown() {
  const { status, data } = useNetworkAggregate();
  const breakdown = useRoadClassBreakdown(data);
  const { toggleRoadClass, roadClassFilter } = useNetworkStore();

  if (status === 'error' || (status === 'empty' && data.length === 0)) {
    return (
      <Card className="h-full min-h-[300px] flex items-center justify-center">
        <p className="text-muted-foreground">No data available</p>
      </Card>
    );
  }

  const handleBarClick = (entry) => {
    toggleRoadClass(entry.name);
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Average Capacity Loss by Road Class</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 relative min-h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={breakdown} layout="vertical" margin={{ top: 20, right: 30, left: 40, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} opacity={0.3} />
            <XAxis 
              type="number" 
              domain={[0, 100]} 
              tickFormatter={(v) => `${v}%`}
              label={{ value: 'Avg Capacity Reduction (%)', position: 'insideBottom', offset: -10 }}
            />
            <YAxis 
              type="category" 
              dataKey="name" 
              tick={{ fontSize: 12 }} 
              width={80}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))', opacity: 0.2 }} />
            
            <Bar 
              dataKey="avgCapacityReduction" 
              isAnimationActive={false}
              onClick={handleBarClick}
              cursor="pointer"
            >
              {breakdown.map((entry, index) => {
                const rgb = interpolateColor(entry.avgCapacityReduction);
                const isFaded = roadClassFilter.length > 0 && !roadClassFilter.includes(entry.name);
                return (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={`rgb(${rgb.join(',')})`} 
                    opacity={isFaded ? 0.3 : 1}
                  />
                );
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
