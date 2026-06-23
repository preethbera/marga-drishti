import React, { useMemo } from 'react';
import { useGeospatialStore } from '../../store/useGeospatialStore';
import { Lightbulb } from 'lucide-react';

function formatNumber(num) {
  if (num == null) return '0';
  return num.toLocaleString();
}

export default function GeospatialInsightsRow({ filters, mappings }) {
  const { mapAggregated, top10, drillDownStats, topOffences } = useGeospatialStore((state) => state.data);
  const isDrillDown = filters.centerCode !== 'all';

  const insightContent = useMemo(() => {
    if (isDrillDown) {
      if (!drillDownStats || !drillDownStats.total_violations || drillDownStats.total_violations.length === 0) {
        return "Analyzing centre data to generate insights...";
      }
      const total = formatNumber(drillDownStats.total_violations[0]);
      const centreName = mappings.centers.find(c => String(c.code) === String(filters.centerCode))?.name || 'Centre';
      const leadPs = drillDownStats.lead_station_name[0] || 'Unknown';
      
      return (
        <span>
          <strong className="text-foreground">{total}</strong> violations recorded in <strong className="text-foreground">{centreName}</strong>. 
          The enforcement is led by <strong className="text-foreground">{leadPs}</strong> police station.
          {topOffences && topOffences.name && topOffences.name.length > 0 ? (
            <> The most frequently cited issue is <strong className="text-foreground">{topOffences.name[0]}</strong>.</>
          ) : null}
        </span>
      );
    } else {
      if (!mapAggregated || !mapAggregated.code || mapAggregated.code.length === 0) {
        return "Scanning city-wide hotspots...";
      }
      const numCentres = mapAggregated.length || 0;
      let totalVio = 0;
      if (mapAggregated.count) {
        for (let i = 0; i < mapAggregated.length; i++) {
          totalVio += Number(mapAggregated.count[i]);
        }
      }
      
      let topHotspotText = '';
      if (top10 && top10.name && top10.name.length > 0) {
        const topName = top10.name[0];
        const topCount = Number(top10.count[0]);
        const pct = ((topCount / totalVio) * 100).toFixed(1);
        topHotspotText = <> The primary hotspot is <strong className="text-foreground">{topName}</strong> accounting for <strong className="text-foreground">{pct}%</strong> of the activity.</>;
      }

      return (
        <span>
          A total of <strong className="text-foreground">{formatNumber(totalVio)}</strong> violations are distributed across <strong className="text-foreground">{numCentres}</strong> commercial centres.
          {topHotspotText}
          {filters.offenceCode !== 'all' && mappings.offences ? (
            <> Analysis filtered specifically to <strong className="text-foreground">{mappings.offences.find(o => String(o.code) === String(filters.offenceCode))?.name}</strong>.</>
          ) : null}
        </span>
      );
    }
  }, [isDrillDown, drillDownStats, mapAggregated, top10, topOffences, mappings, filters]);

  return (
    <div className="w-full bg-primary/5 border border-primary/20 rounded-lg p-3 flex items-center gap-3 text-sm text-muted-foreground shadow-sm">
      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
        <Lightbulb className="w-4 h-4 text-primary" />
      </div>
      <div className="flex-1 leading-relaxed">
        {insightContent}
      </div>
    </div>
  );
}
