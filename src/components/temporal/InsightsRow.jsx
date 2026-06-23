import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Sparkles, Car } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { CustomChartTooltip } from '@/components/ui/recharts-tooltip';

const CHART_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
  'var(--chart-6)',
  'var(--chart-7)',
  'var(--chart-8)'
];

export default function InsightsRow({ dataA, filtersA }) {
  const renderVehicleMix = (mixData) => {
    if (!mixData || !mixData.length) return null;
    
    // Process top 5 + Others
    const parsedData = [];
    if (mixData.type && mixData.count) {
      for (let i = 0; i < mixData.length; i++) {
        parsedData.push({
          type: mixData.type[i],
          count: Number(mixData.count[i])
        });
      }
    }
    
    let displayData = parsedData.sort((a, b) => b.count - a.count);
    const total = displayData.reduce((sum, item) => sum + item.count, 0);
    
    if (displayData.length > 6) {
      const top5 = displayData.slice(0, 5);
      const othersCount = displayData.slice(5).reduce((sum, item) => sum + item.count, 0);
      displayData = [...top5, { type: 'OTHER', count: othersCount }];
    }

    return (
      <Card className="flex-1 shrink-0">
        <CardHeader className="pb-2 flex flex-row items-center gap-2">
          <Car className="w-4 h-4 text-muted-foreground" />
          <CardTitle className="text-sm font-semibold m-0">Vehicle Mix</CardTitle>
        </CardHeader>
        <CardContent className="p-0 pb-4 px-4 h-[140px] flex items-center">
          <div className="w-[120px] h-full shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={displayData}
                  cx="50%"
                  cy="50%"
                  innerRadius={30}
                  outerRadius={50}
                  paddingAngle={2}
                  dataKey="count"
                  stroke="none"
                >
                  {displayData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  content={<CustomChartTooltip />}
                  formatter={(value) => [value.toLocaleString(), 'Violations']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 flex flex-col gap-1.5 pl-4 justify-center">
            {displayData.map((item, idx) => (
              <div key={item.type} className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5 overflow-hidden">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }} />
                  <span className="truncate max-w-[80px]" title={item.type}>{item.type}</span>
                </div>
                <span className="font-semibold">{total > 0 ? Math.round((item.count / total) * 100) : 0}%</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="flex flex-col xl:flex-row gap-4 w-full">
      <Card className="bg-gradient-to-br from-primary/10 to-transparent border-primary/20 flex-1">
        <CardHeader className="pb-2 flex flex-row items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <CardTitle className="text-sm font-semibold m-0 text-primary">Enforcement Insight</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed text-foreground">
            During the selected {filtersA.timeRange[0]}:00-{filtersA.timeRange[1]}:00 window on {filtersA.dayOfWeek === 'all' ? 'all days' : filtersA.dayOfWeek}, 
            recorded violations reach {dataA?.kpis?.violationsInWindow?.toLocaleString() || 0}. 
            {dataA?.kpis?.topStationCode && ` ${dataA.kpis.topStationCode} shows the highest concentration.`}
          </p>
        </CardContent>
      </Card>
      
      {renderVehicleMix(dataA?.vehicleMix)}
    </div>
  );
}
