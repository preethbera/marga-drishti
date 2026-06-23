import React, { useMemo } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip, CartesianGrid } from 'recharts';
import { format, parseISO } from 'date-fns';
import { Skeleton } from '../ui/skeleton';

import { CustomChartTooltip } from '@/components/ui/recharts-tooltip';

export default function DailyVolumeTrend({ trendData, stats, isLoading }) {
  const chartData = useMemo(() => {
    if (!trendData || !trendData.date || !trendData.count) return [];
    
    // Map Arrow columnar data to array of objects
    return Array.from(trendData.date).map((d, i) => ({
      date: String(d).split(' ')[0], // Extract just the YYYY-MM-DD
      count: Number(trendData.count[i])
    }));
  }, [trendData]);

  if (isLoading) {
    return <Skeleton className="w-full h-80 mt-6 rounded-lg" />;
  }

  if (chartData.length === 0) {
    return (
      <div className="w-full mt-6 border rounded-lg p-6 bg-card">
        <h3 className="font-semibold text-lg">Daily Volume Trend</h3>
        <div className="h-64 flex items-center justify-center">
          <p className="text-muted-foreground text-sm">No trend data available.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full mt-6 border rounded-lg p-5 bg-card">
      <div className="mb-4">
        <h3 className="font-semibold text-lg">Daily Volume Trend</h3>
        <p className="text-sm text-muted-foreground">
          Tickets issued per day
        </p>
      </div>
      
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
            <XAxis 
              dataKey="date" 
              axisLine={false}
              tickLine={false}
              tickFormatter={(val) => {
                try {
                  return format(parseISO(val), 'MMM dd');
                } catch {
                  return val;
                }
              }}
              minTickGap={30}
              tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tickFormatter={(val) => val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}
              tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
              width={45}
            />
            <RechartsTooltip 
              content={<CustomChartTooltip />} 
              formatter={(value) => [Number(value).toLocaleString(), "Tickets"]}
              labelFormatter={(label) => {
                try {
                  return label ? format(parseISO(label), 'MMM dd, yyyy') : '';
                } catch {
                  return label;
                }
              }}
            />
            <Area 
              type="monotone" 
              dataKey="count" 
              stroke="var(--chart-1)" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorCount)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
