import React, { useMemo } from 'react';
import { useNetworkStore } from '@/store/useNetworkStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Cell as PieCell } from 'recharts';

export default function NetworkBreakdowns() {
  const { processedSegments, roadClasses, toggleRoadClass } = useNetworkStore();

  const { classData, riskData } = useMemo(() => {
    if (!processedSegments || processedSegments.length === 0) return { classData: [], riskData: [] };

    // Group by Road Class
    const classMap = {};
    const riskMap = { Safe: 0, Marginal: 0, Critical: 0, TrafficJam: 0 };

    processedSegments.forEach(s => {
      // Risk Dist
      if (s.capacityLoss >= 100) riskMap.TrafficJam++;
      else if (s.capacityLoss >= 50) riskMap.Critical++;
      else if (s.capacityLoss >= 20) riskMap.Marginal++;
      else riskMap.Safe++;

      // Map raw road class to display label
      let displayClass = 'Local';
      if (s.road_class === 'arterial') displayClass = 'Arterial';
      if (s.road_class === 'sub_arterial') displayClass = 'Sub-Arterial';
      if (s.road_class === 'collector') displayClass = 'Collector';

      // Class Aggregation
      if (!classMap[displayClass]) {
        classMap[displayClass] = { count: 0, sumLossWeight: 0, sumLength: 0, sumPCU: 0, rawId: s.road_class };
      }
      classMap[displayClass].count++;
      classMap[displayClass].sumLength += s.length;
      classMap[displayClass].sumLossWeight += s.capacityLoss * s.length;
      classMap[displayClass].sumPCU += s.concurrentPCU;
    });

    const classData = Object.keys(classMap).map(cls => ({
      name: cls,
      rawId: classMap[cls].rawId,
      avgLoss: classMap[cls].sumLength > 0 ? classMap[cls].sumLossWeight / classMap[cls].sumLength : 0,
      count: classMap[cls].count,
      length: classMap[cls].sumLength,
      pcu: classMap[cls].sumPCU,
      isActive: roadClasses.length === 0 || roadClasses.includes(classMap[cls].rawId)
    })).sort((a, b) => b.avgLoss - a.avgLoss);

    const riskData = [
      { name: 'Safe', value: riskMap.Safe, color: '#22c55e' },
      { name: 'Marginal', value: riskMap.Marginal, color: '#eab308' },
      { name: 'Critical', value: riskMap.Critical, color: '#f97316' },
      { name: 'Traffic Jam', value: riskMap.TrafficJam, color: '#991b1b' }
    ].filter(d => d.value > 0);

    return { classData, riskData };
  }, [processedSegments, roadClasses]);

  const CustomBarTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-card border rounded-lg shadow-xl p-3 text-sm min-w-[200px]">
          <div className="font-bold border-b pb-1 mb-2">{data.name}</div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            <span className="text-muted-foreground">Avg Capacity Loss:</span>
            <span className="text-right font-medium">{data.avgLoss.toFixed(1)}%</span>
            
            <span className="text-muted-foreground">Segments:</span>
            <span className="text-right font-medium">{data.count}</span>
            
            <span className="text-muted-foreground">Total PCU:</span>
            <span className="text-right font-medium">{Math.round(data.pcu)}</span>
            
            <span className="text-muted-foreground">Total Length:</span>
            <span className="text-right font-medium">{(data.length / 1000).toFixed(2)} km</span>
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomPieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-card border rounded-lg shadow-xl p-3 text-sm min-w-[150px]">
          <div className="font-bold border-b pb-1 mb-2 flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: data.color }}></div>
            {data.name}
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Segments:</span>
            <span className="font-medium">{data.value}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase">Average Capacity Loss by Road Class</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <BarChart data={classData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
              <XAxis type="number" domain={[0, 100]} stroke="#888" fontSize={12} tickFormatter={(v) => `${v}%`} />
              <YAxis dataKey="name" type="category" stroke="#888" fontSize={12} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomBarTooltip />} cursor={{ fill: 'var(--accent)' }} />
              <Bar 
                dataKey="avgLoss" 
                radius={[0, 4, 4, 0]}
                onClick={(data) => toggleRoadClass(data.rawId)}
                className="cursor-pointer"
              >
                {classData.map((entry, index) => {
                  let fill = '#22c55e';
                  if (entry.avgLoss >= 100) fill = '#ef4444';
                  else if (entry.avgLoss >= 50) fill = '#f97316';
                  else if (entry.avgLoss >= 20) fill = '#eab308';
                  
                  return <Cell key={`cell-${index}`} fill={fill} fillOpacity={entry.isActive ? 1 : 0.3} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase">Network Risk Distribution</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <PieChart>
              <Pie
                data={riskData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
              >
                {riskData.map((entry, index) => (
                  <PieCell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomPieTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
