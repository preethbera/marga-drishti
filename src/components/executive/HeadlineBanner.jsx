import React from 'react';
import { FileText } from 'lucide-react';
import { format } from 'date-fns';
import { Skeleton } from '../ui/skeleton';

export default function HeadlineBanner({ stats, dateRange, isLoading }) {
  if (isLoading || !stats || !stats.total_violations) {
    return <Skeleton className="w-full h-24 mt-6 rounded-lg" />;
  }

  const startDate = dateRange?.from ? format(dateRange.from, 'MMM dd, yyyy') : '';
  const endDate = dateRange?.to ? format(dateRange.to, 'MMM dd, yyyy') : '';
  
  const currentTotal = Number(stats.total_violations?.[0] || 0);
  const totalStr = currentTotal.toLocaleString() || '0';
  
  const topOffenceName = stats.top_offence_code?.[0] || 'Unknown Offence';
  const topOffenceCount = Number(stats.top_offence_count?.[0] || 0);
  const topOffencePercent = currentTotal > 0 ? ((topOffenceCount / currentTotal) * 100).toFixed(1) : 0;
  
  const topStationName = stats.top_station_code?.[0] || 'Unknown Station';
  const topStationCount = Number(stats.top_station_count?.[0] || 0);
  const topStationPercent = currentTotal > 0 ? ((topStationCount / currentTotal) * 100).toFixed(1) : 0;
  
  const peakHour = stats.peak_hour?.[0] !== undefined ? `${String(stats.peak_hour[0]).padStart(2, '0')}:00` : 'Unknown';

  return (
    <div className="w-full mt-6 bg-primary/5 border border-primary/20 rounded-lg p-5 flex items-start gap-4">
      <div className="mt-1 bg-primary/10 p-2 rounded-full text-primary shrink-0">
        <FileText className="w-5 h-5" />
      </div>
      <p className="text-sm md:text-base leading-relaxed">
        <strong>{totalStr}</strong> violations recorded between <strong>{startDate}</strong> and <strong>{endDate}</strong>. 
        <strong> {topOffenceName}</strong> alone accounts for <strong>{topOffencePercent}%</strong> of all tickets, 
        and <strong>{topStationName}</strong> handles <strong>{topStationPercent}%</strong> of city-wide volume. 
        Peak enforcement hour is <strong>{peakHour}</strong>.
      </p>
    </div>
  );
}
