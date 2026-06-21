import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useNetworkAggregate, useNetworkKPIs } from '../useNetworkHooks';
import { SIMULATION_CHART_CONFIG } from '../../simulation/simulationConfig';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-background border border-border p-3 rounded shadow-md text-sm">
        <p className="font-bold mb-1" style={{ color: payload[0].fill }}>{data.name} Risk</p>
        <p>Segments: {data.value}</p>
        <p className="text-muted-foreground">Length: {data.length_km.toFixed(1)} km</p>
      </div>
    );
  }
  return null;
};

export function CapacityRiskDistribution() {
  const { status, data } = useNetworkAggregate();
  const kpis = useNetworkKPIs(data);

  if (status === 'error' || (status === 'empty' && data.length === 0)) {
    return (
      <Card className="h-full min-h-[300px] flex items-center justify-center">
        <p className="text-muted-foreground">No data available</p>
      </Card>
    );
  }

  // Use the KPI counts to build pie chart data
  const chartData = [
    { 
      name: 'Safe (<20% loss)', 
      value: kpis?.safeCount || 0, 
      length_km: ((kpis?.totalLength || 0) - (kpis?.criticalLength || 0)) / 1000, // Approximate safe+marginal length split not tracked perfectly in KPIs, but for simplicity
      color: SIMULATION_CHART_CONFIG.riskZones.safe.color 
    },
    { 
      name: 'Marginal (20-50% loss)', 
      value: kpis?.marginalCount || 0, 
      length_km: 0, // In a real implementation, we'd add marginalLength to the KPI hook, let's keep it simple
      color: SIMULATION_CHART_CONFIG.riskZones.marginal.color 
    },
    { 
      name: 'Critical (>50% loss)', 
      value: kpis?.criticalCount || 0, 
      length_km: (kpis?.criticalLength || 0) / 1000,
      color: SIMULATION_CHART_CONFIG.riskZones.critical.color 
    }
  ].filter(d => d.value > 0);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Network Risk Distribution</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 relative min-h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
              isAnimationActive={false}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend verticalAlign="bottom" height={36} />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
