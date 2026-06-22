import React, { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { TriangleAlert } from 'lucide-react';

const DOW_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

export default function DayHourHeatmap({ data, filters, setFilters }) {
  const maxCount = useMemo(() => {
    if (!data || data.length === 0) return 1;
    return Math.max(...data.map(d => d.count));
  }, [data]);

  // Create a 7x24 grid of data
  const grid = useMemo(() => {
    const matrix = Array.from({ length: 7 }, () => Array(24).fill(null));
    if (data) {
      data.forEach(d => {
        if (d.dow >= 0 && d.dow <= 6 && d.hour >= 0 && d.hour <= 23) {
          matrix[d.dow][d.hour] = d;
        }
      });
    }
    return matrix;
  }, [data]);

  const isCellActive = (dow, hour) => {
    const isDowMatch = filters.dayOfWeek === 'all' || filters.dayOfWeek === DOW_LABELS[dow];
    const isHourMatch = hour >= filters.timeRange[0] && hour <= filters.timeRange[1];
    return isDowMatch && isHourMatch;
  };

  const handleCellClick = (dow, hour) => {
    setFilters({ dayOfWeek: DOW_LABELS[dow], timeRange: [hour, hour] });
  };

  const handleDowClick = (dow) => {
    setFilters({ dayOfWeek: DOW_LABELS[dow], timeRange: [0, 23] });
  };

  const handleHourClick = (hour) => {
    setFilters({ dayOfWeek: 'all', timeRange: [hour, hour] });
  };

  const getColor = (count) => {
    if (!count) return 'bg-muted/30';
    const ratio = Math.min(count / maxCount, 1);
    // Interpolate from slate-100 to violet-900 roughly
    if (ratio < 0.1) return 'bg-slate-100 dark:bg-slate-800';
    if (ratio < 0.3) return 'bg-violet-200 dark:bg-violet-900/40';
    if (ratio < 0.5) return 'bg-violet-400 dark:bg-violet-800/60';
    if (ratio < 0.7) return 'bg-violet-600 dark:bg-violet-700/80';
    return 'bg-violet-800 dark:bg-violet-600';
  };

  return (
    <Card className="w-full shrink-0 overflow-hidden">
      <CardHeader className="pb-4 flex flex-row items-center justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <TriangleAlert className="w-5 h-5 text-warning" />
            <CardTitle className="text-base">Day × Hour Violation Heatmap</CardTitle>
          </div>
          <CardDescription className="text-xs">
            The whole week at a glance — darker cells indicate higher violation volume. Click or drag to filter the map above.
          </CardDescription>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Low</span>
          <div className="h-3 w-24 rounded bg-gradient-to-r from-slate-100 via-violet-400 to-violet-800 dark:from-slate-800 dark:to-violet-600" />
          <span>High</span>
        </div>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="flex w-full">
          {/* Y-axis Labels */}
          <div className="flex flex-col gap-1 pr-2 pt-6">
            {DOW_LABELS.map((day, i) => (
              <div 
                key={day} 
                className="h-8 flex items-center justify-end text-[10px] font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                onClick={() => handleDowClick(i)}
              >
                {day}
              </div>
            ))}
          </div>
          
          {/* Grid Area */}
          <div className="flex-1 flex flex-col gap-1 overflow-x-auto pb-2">
            {/* X-axis Labels */}
            <div className="flex gap-1 mb-1">
              {HOURS.map((hour) => (
                <div 
                  key={hour} 
                  className="flex-1 min-w-4 text-center text-[10px] font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                  onClick={() => handleHourClick(hour)}
                >
                  {hour % 3 === 0 ? hour : ''}
                </div>
              ))}
            </div>
            
            {/* Heatmap Cells */}
            {grid.map((row, dow) => (
              <div key={dow} className="flex gap-1">
                {row.map((cellData, hour) => {
                  const count = cellData?.count || 0;
                  const isAnomaly = cellData && cellData.count > (cellData.mean + 1.5 * cellData.std);
                  const active = isCellActive(dow, hour);
                  
                  return (
                    <div
                      key={hour}
                      className={`
                        relative flex-1 min-w-4 h-8 rounded-sm cursor-pointer transition-colors
                        ${getColor(count)}
                        ${active ? 'ring-2 ring-primary ring-inset z-10' : 'hover:ring-1 hover:ring-foreground/50'}
                      `}
                      onClick={() => handleCellClick(dow, hour)}
                      title={`${DOW_LABELS[dow]} ${hour}:00 - ${count.toLocaleString()} violations`}
                    >
                      {isAnomaly && (
                        <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-yellow-400 rounded-full shadow-sm" />
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-4 text-[11px] text-muted-foreground">
          <span>Click a cell, or use a row/column header to filter the map.</span>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 bg-yellow-400 rounded-full" />
            <span>Anomaly (&gt;1.5σ above mean)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
