import React, { useMemo } from 'react';
import { Car } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, CartesianGrid, Cell } from 'recharts';
import { Skeleton } from '../ui/skeleton';

import { CustomChartTooltip } from '@/components/ui/recharts-tooltip';

export default function VehicleMix({ vehicleMix, stats, isLoading }) {
  const chartData = useMemo(() => {
    if (!vehicleMix || !vehicleMix.type || !vehicleMix.count) return [];
    
    return Array.from(vehicleMix.type).map((type, i) => ({
      type: String(type),
      count: Number(vehicleMix.count[i]),
      index: i
    }));
  }, [vehicleMix]);

  const currentTotal = Number(stats?.total_violations?.[0] || 0);

  if (isLoading) {
    return (
      <div className="w-full mt-4 border rounded-lg p-5 bg-card">
        <div className="flex items-center gap-2 mb-4">
          <Car className="w-5 h-5 text-muted-foreground" />
          <h3 className="font-semibold text-lg">Vehicle Mix</h3>
        </div>
        <Skeleton className="w-full h-72 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="w-full mt-4 border rounded-lg p-5 bg-card">
      <div className="flex items-center gap-2 mb-1">
        <Car className="w-5 h-5 text-muted-foreground" />
        <h3 className="font-semibold text-lg">Vehicle Mix</h3>
      </div>
      <p className="text-sm text-muted-foreground mb-6">All vehicle types with their share of total violations.</p>
      
      {chartData.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
          No vehicle data available.
        </div>
      ) : (
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis 
                dataKey="type" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                angle={-35}
                textAnchor="end"
                interval={0}
                height={50}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tickFormatter={(val) => val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}
                tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                width={45}
              />
              <RechartsTooltip 
                cursor={{ fill: 'var(--muted)', fillOpacity: 0.4 }} 
                content={<CustomChartTooltip />} 
                formatter={(value) => {
                  const share = currentTotal > 0 ? ((Number(value) / currentTotal) * 100).toFixed(1) : 0;
                  return [`${Number(value).toLocaleString()} (${share}%)`, "Count"];
                }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={`var(--chart-${(index % 8) + 1})`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
