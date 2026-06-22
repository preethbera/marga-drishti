import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Slider } from '../ui/slider';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/select';
import { Sparkles, Car } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

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

export default function SidebarColumn({ 
  compareMode,
  filtersA,
  setFiltersA,
  filtersB,
  setFiltersB,
  dataA,
  dataB
}) {
  const formatTime = (hour) => `${String(hour).padStart(2, '0')}:00`;

  const renderTemporalControls = (title, description, filters, setFilters) => (
    <Card className="shrink-0">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
        <CardDescription className="text-xs">{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-muted-foreground">TIME WINDOW</span>
            <div className="bg-muted px-2 py-1 rounded text-xs font-mono">
              {formatTime(filters.timeRange[0])} – {formatTime(filters.timeRange[1])}
            </div>
          </div>
          <div className="px-1 mt-2">
            <Slider
              min={0}
              max={23}
              step={1}
              value={filters.timeRange}
              onValueChange={(val) => setFilters({ timeRange: val })}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold text-muted-foreground">DAY OF WEEK</span>
          <Select value={filters.dayOfWeek} onValueChange={(val) => setFilters({ dayOfWeek: val })}>
            <SelectTrigger className="w-full text-xs h-8">
              <SelectValue placeholder="Select day" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Days</SelectItem>
              <SelectItem value="Sunday">Sunday</SelectItem>
              <SelectItem value="Monday">Monday</SelectItem>
              <SelectItem value="Tuesday">Tuesday</SelectItem>
              <SelectItem value="Wednesday">Wednesday</SelectItem>
              <SelectItem value="Thursday">Thursday</SelectItem>
              <SelectItem value="Friday">Friday</SelectItem>
              <SelectItem value="Saturday">Saturday</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );

  const renderVehicleMix = (mixData) => {
    if (!mixData || mixData.length === 0) return null;
    
    // Process top 5 + Others
    let displayData = [...mixData].sort((a, b) => b.count - a.count);
    const total = displayData.reduce((sum, item) => sum + item.count, 0);
    
    if (displayData.length > 6) {
      const top5 = displayData.slice(0, 5);
      const othersCount = displayData.slice(5).reduce((sum, item) => sum + item.count, 0);
      displayData = [...top5, { type: 'OTHER', count: othersCount }];
    }

    return (
      <Card className="shrink-0 flex-1">
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
                  formatter={(value) => [value.toLocaleString(), 'Violations']}
                  contentStyle={{ 
                    borderRadius: '8px', 
                    border: '1px solid var(--border)', 
                    backgroundColor: 'var(--popover)',
                    color: 'var(--popover-foreground)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)', 
                    fontSize: '12px' 
                  }}
                  itemStyle={{ color: 'var(--foreground)' }}
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

  const renderComparisonSummary = () => {
    const aCount = dataA?.kpis?.violationsInWindow || 0;
    const bCount = dataB?.kpis?.violationsInWindow || 0;
    const diff = bCount - aCount;
    const diffColor = diff > 0 ? 'text-destructive' : diff < 0 ? 'text-success' : 'text-muted-foreground';

    return (
      <div className="flex flex-col gap-2 mt-4 pt-4 border-t">
        <span className="text-xs font-semibold text-muted-foreground uppercase">Comparison</span>
        <div className="flex justify-between text-sm">
          <span>Window A</span>
          <span className="font-semibold">{aCount.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Window B</span>
          <span className="font-semibold">{bCount.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>B − A</span>
          <span className={`font-bold ${diffColor}`}>{diff > 0 ? '+' : ''}{diff.toLocaleString()}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-4 w-full h-full overflow-y-auto pr-2 pb-4">
      {renderTemporalControls(
        compareMode ? "Window A Controls" : "Temporal Controls",
        "Filter by time window and day.",
        filtersA,
        setFiltersA
      )}

      {!compareMode ? (
        <div className="flex flex-col gap-4 flex-1">
          <Card className="bg-gradient-to-br from-primary/10 to-transparent border-primary/20 shrink-0">
            <CardHeader className="pb-2 flex flex-row items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <CardTitle className="text-sm font-semibold m-0 text-primary">Enforcement Insight</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs leading-relaxed text-foreground">
                During the selected {filtersA.timeRange[0]}:00-{filtersA.timeRange[1]}:00 window on {filtersA.dayOfWeek === 'all' ? 'all days' : filtersA.dayOfWeek}, 
                recorded violations reach {dataA?.kpis?.violationsInWindow?.toLocaleString() || 0}. 
                {dataA?.kpis?.topStationCode && ` ${dataA.kpis.topStationCode} shows the highest concentration.`}
              </p>
            </CardContent>
          </Card>
          
          {renderVehicleMix(dataA?.vehicleMix)}
        </div>
      ) : (
        <Card className="shrink-0 border-primary/50">
          <CardHeader className="pb-3 bg-primary/5">
            <CardTitle className="text-sm font-semibold text-primary">Window B Controls</CardTitle>
            <CardDescription className="text-xs">Second comparison window.</CardDescription>
          </CardHeader>
          <CardContent className="pt-4 flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-muted-foreground">TIME WINDOW</span>
                <div className="bg-muted px-2 py-1 rounded text-xs font-mono border-primary/20 border text-primary">
                  {formatTime(filtersB.timeRange[0])} – {formatTime(filtersB.timeRange[1])}
                </div>
              </div>
              <div className="px-1 mt-2">
                <Slider
                  min={0}
                  max={23}
                  step={1}
                  value={filtersB.timeRange}
                  onValueChange={(val) => setFiltersB({ timeRange: val })}
                  className="[&_[data-slot=slider-range]]:bg-primary"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold text-muted-foreground">DAY OF WEEK</span>
              <Select value={filtersB.dayOfWeek} onValueChange={(val) => setFiltersB({ dayOfWeek: val })}>
                <SelectTrigger className="w-full text-xs h-8 border-primary/30">
                  <SelectValue placeholder="Select day" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Days</SelectItem>
                  <SelectItem value="Sunday">Sunday</SelectItem>
                  <SelectItem value="Monday">Monday</SelectItem>
                  <SelectItem value="Tuesday">Tuesday</SelectItem>
                  <SelectItem value="Wednesday">Wednesday</SelectItem>
                  <SelectItem value="Thursday">Thursday</SelectItem>
                  <SelectItem value="Friday">Friday</SelectItem>
                  <SelectItem value="Saturday">Saturday</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {renderComparisonSummary()}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
