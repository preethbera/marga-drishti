import React from 'react';
import { Activity, TriangleAlert, MapPin, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { Skeleton } from '../ui/skeleton';
import { cn } from '../../lib/utils';

export default function KPIStrip({ stats, dateRange, mappings, isLoading }) {
  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  const startDate = dateRange?.from ? format(dateRange.from, 'MMM dd, yyyy') : '';
  const endDate = dateRange?.to ? format(dateRange.to, 'MMM dd, yyyy') : '';
  const dateRangeStr = `${startDate} → ${endDate}`;

  // KPI 1: Total Violations
  const currentTotal = Number(stats.total_violations?.[0] || 0);

  // KPI 2: Top Offence
  const rawOffenceCode = stats.top_offence_code?.[0];
  let topOffenceName = rawOffenceCode || 'Unknown';
  if (rawOffenceCode && mappings?.offences) {
    const matched = mappings.offences.find(m => m.code === String(rawOffenceCode));
    if (matched) {
      topOffenceName = `${rawOffenceCode} - ${matched.name}`;
    }
  }
  
  // KPI 3: Top Station
  const rawStationCode = stats.top_station_code?.[0];
  let topStationName = rawStationCode || 'Unknown';
  if (rawStationCode && mappings?.centers) {
    const matched = mappings.centers.find(m => m.code === String(rawStationCode));
    if (matched) {
      topStationName = matched.name;
    }
  }
  const topStationCount = Number(stats.top_station_count?.[0] || 0);
  const topStationShare = currentTotal > 0 ? ((topStationCount / currentTotal) * 100).toFixed(1) : 0;

  // KPI 4: Peak Hour
  const peakHour = stats.peak_hour?.[0] !== undefined ? `${String(stats.peak_hour[0]).padStart(2, '0')}:00` : '--:--';
  const peakDayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const peakDay = stats.peak_day?.[0] !== undefined ? peakDayNames[stats.peak_day[0]] : 'Unknown';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
      
      {/* KPI 1 - Total Violations */}
      <div className="relative border rounded-lg p-5 bg-card overflow-hidden group">
        <div className="flex items-start justify-between">
          <p className="text-xs uppercase text-muted-foreground font-semibold">Total Violations</p>
          <Activity className="w-4 h-4 text-muted-foreground" />
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <h2 className="text-3xl font-bold">{currentTotal.toLocaleString()}</h2>
        </div>
        <div className="mt-1 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">{dateRangeStr}</p>
        </div>
      </div>

      {/* KPI 2 - Top Offence */}
      <div className="border border-destructive/30 rounded-lg p-5 bg-destructive/5 group">
        <div className="flex items-start justify-between">
          <p className="text-xs uppercase text-destructive/80 font-semibold">Top Offence</p>
          <TriangleAlert className="w-4 h-4 text-destructive/80" />
        </div>
        <div className="mt-2 w-full overflow-hidden">
          <h2 className="text-xl sm:text-2xl font-bold text-destructive truncate" title={topOffenceName}>{topOffenceName}</h2>
        </div>
        <div className="mt-1">
          <p className="text-xs text-muted-foreground/80">Most frequent violation type</p>
        </div>
      </div>

      {/* KPI 3 - Top Station */}
      <div className="border rounded-lg p-5 bg-card group">
        <div className="flex items-start justify-between">
          <p className="text-xs uppercase text-muted-foreground font-semibold">Top Station</p>
          <MapPin className="w-4 h-4 text-muted-foreground" />
        </div>
        <div className="mt-2 w-full overflow-hidden">
          <h2 className="text-xl sm:text-2xl font-bold truncate" title={topStationName}>{topStationName}</h2>
        </div>
        <div className="mt-1">
          <p className="text-xs text-muted-foreground">{topStationCount.toLocaleString()} violations · {topStationShare}% of total</p>
        </div>
      </div>

      {/* KPI 4 - Peak Hour */}
      <div className="border rounded-lg p-5 bg-card group">
        <div className="flex items-start justify-between">
          <p className="text-xs uppercase text-muted-foreground font-semibold">Peak Hour</p>
          <Clock className="w-4 h-4 text-muted-foreground" />
        </div>
        <div className="mt-2">
          <h2 className="text-3xl font-bold">{peakHour}</h2>
        </div>
        <div className="mt-1">
          <p className="text-xs text-muted-foreground">Most active on {peakDay}</p>
        </div>
      </div>

    </div>
  );
}
