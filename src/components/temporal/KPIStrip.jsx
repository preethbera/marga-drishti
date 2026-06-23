import React from 'react';
import { Card, CardContent } from '../ui/card';
import { Activity, PieChart, Clock, MapPin } from 'lucide-react';

const DOW_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function KPIStrip({ kpis }) {
  if (!kpis) return null;

  const {
    violationsInWindow,
    totalViolations,
    topStationCode,
    topStationName,
    topStationCount,
    peakDow,
    peakHour
  } = kpis;

  const percentage = totalViolations > 0 ? ((violationsInWindow / totalViolations) * 100).toFixed(1) : 0;
  
  const formattedPeakHour = peakHour !== undefined && peakDow !== undefined 
    ? `${String(peakHour).padStart(2, '0')}:00 · ${DOW_LABELS[peakDow]}`
    : 'N/A';

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full shrink-0">
      <Card>
        <CardContent className="p-4 flex flex-col gap-1 justify-between h-full">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold uppercase text-muted-foreground">Violations in Window</span>
            <Activity className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold">{violationsInWindow?.toLocaleString() || 0}</div>
          <div className="text-xs text-muted-foreground">of {totalViolations?.toLocaleString() || 0} total</div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 flex flex-col gap-1 justify-between h-full">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold uppercase text-muted-foreground">Window Share</span>
            <PieChart className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold">{percentage}%</div>
          <div className="text-xs text-muted-foreground">of all weekly violations</div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 flex flex-col gap-1 justify-between h-full">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold uppercase text-muted-foreground">Peak Hour / Day</span>
            <Clock className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold">{formattedPeakHour}</div>
          <div className="text-xs text-muted-foreground">busiest slot in current window</div>
        </CardContent>
      </Card>

      <Card className="border-destructive/50">
        <CardContent className="p-4 flex flex-col gap-1 justify-between h-full">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold uppercase text-destructive">Top Hotspot Station</span>
            <MapPin className="w-4 h-4 text-destructive" />
          </div>
          <div className="text-2xl font-bold truncate" title={topStationName ? `${topStationName} (${topStationCode})` : (topStationCode || 'Unknown')}>
            {topStationName ? `${topStationName}` : (topStationCode || 'Unknown')}
          </div>
          <div className="text-xs text-muted-foreground">{topStationCount?.toLocaleString() || 0} violations in window</div>
        </CardContent>
      </Card>
    </div>
  );
}
