import React, { useMemo } from 'react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { RefreshCcw, FileText } from 'lucide-react';
import { useGeospatialStore } from '../../store/useGeospatialStore';

function formatNumber(num) {
  if (num == null) return '0';
  return num.toLocaleString();
}

export default function FilterBar({ filters, mappings, onFilterChange, onReset }) {
  const { mapAggregated, top10, drillDownStats, topOffences } = useGeospatialStore((state) => state.data);
  const isDrillDown = filters.centerCode !== 'all';

  // Compute Auto-Insight
  const insightText = useMemo(() => {
    if (isDrillDown) {
      if (!drillDownStats || !drillDownStats.total_violations || drillDownStats.total_violations.length === 0) {
        return "Loading centre insights...";
      }
      const total = formatNumber(drillDownStats.total_violations[0]);
      const centreName = mappings.centers.find(c => c.code === filters.centerCode)?.name || 'Centre';
      const leadPs = drillDownStats.lead_station_name[0] || 'Unknown';
      let topOffenceText = '';
      if (topOffences && topOffences.name && topOffences.name.length > 0) {
        topOffenceText = ` · Most-cited offence **${topOffences.name[0]}**`;
      }
      
      return (
        <span className="text-muted-foreground">
          <strong className="text-foreground">{total}</strong> violations in <strong className="text-foreground">{centreName}</strong> 
          {' '}· Lead station <strong className="text-foreground">{leadPs}</strong>
          {topOffences && topOffences.name && topOffences.name.length > 0 ? (
            <> · Most-cited offence <strong className="text-foreground">{topOffences.name[0]}</strong></>
          ) : null}
        </span>
      );
    } else {
      if (!mapAggregated || !mapAggregated.code || mapAggregated.code.length === 0) {
        return "Loading city-wide insights...";
      }
      const numCentres = mapAggregated.code.length;
      let totalVio = 0;
      for (let i = 0; i < mapAggregated.count.length; i++) {
        totalVio += mapAggregated.count[i];
      }
      
      let topHotspotText = '';
      if (top10 && top10.name && top10.name.length > 0) {
        const topName = top10.name[0];
        const topCount = top10.count[0];
        const pct = ((topCount / totalVio) * 100).toFixed(1);
        topHotspotText = ` · Top hotspot **${topName}** (${formatNumber(topCount)}, ${pct}%)`;
      }

      return (
        <span className="text-muted-foreground">
          <strong className="text-foreground">{formatNumber(totalVio)}</strong> violations across <strong className="text-foreground">{numCentres}</strong> centres
          {topHotspotText}
          {filters.offenceCode !== 'all' && mappings.offences ? (
            <> · Filtered to <strong className="text-foreground">{mappings.offences.find(o => o.code === filters.offenceCode)?.name}</strong></>
          ) : null}
        </span>
      );
    }
  }, [isDrillDown, drillDownStats, mapAggregated, top10, topOffences, mappings, filters]);

  return (
    <div className="flex flex-col w-full bg-card border-b shrink-0 z-20 shadow-sm relative">
      {/* Top Row: Title + Filters */}
      <div className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold">Geospatial Hotspots</h1>
          <Badge variant="secondary" className="text-xs font-normal bg-muted/50 text-muted-foreground">
            Where parking chokes the city
          </Badge>
        </div>

        <div className="flex items-center gap-3">
          <Select 
            value={filters.centerCode} 
            onValueChange={(val) => onFilterChange({ centerCode: val })}
          >
            <SelectTrigger className="w-[200px] h-8 text-xs bg-background">
              <SelectValue placeholder="Search Centre" />
            </SelectTrigger>
            <SelectContent>
              {mappings.centers.map((c) => (
                <SelectItem key={c.code} value={String(c.code)}>
                  {c.code === 'all' ? c.name : `${c.code} — ${c.name}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select 
            value={filters.offenceCode} 
            onValueChange={(val) => onFilterChange({ offenceCode: val })}
          >
            <SelectTrigger className="w-[220px] h-8 text-xs bg-background">
              <SelectValue placeholder="Search Offence" />
            </SelectTrigger>
            <SelectContent>
              {mappings.offences.map((o) => (
                <SelectItem key={o.code} value={String(o.code)}>
                  {o.code === 'all' ? o.name : `${o.code} — ${o.name}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select 
            value={filters.vehicleType} 
            onValueChange={(val) => onFilterChange({ vehicleType: val })}
          >
            <SelectTrigger className="w-[180px] h-8 text-xs bg-background">
              <SelectValue placeholder="Vehicle Type" />
            </SelectTrigger>
            <SelectContent>
              {mappings.vehicles.map((v) => (
                <SelectItem key={v.code} value={String(v.code)}>
                  {v.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="w-px h-5 bg-border mx-1" />

          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 text-xs text-muted-foreground hover:text-foreground"
            onClick={onReset}
          >
            <RefreshCcw className="w-3.5 h-3.5 mr-1.5" />
            Reset
          </Button>
        </div>
      </div>

      {/* Bottom Row: Auto-Insight */}
      <div className="flex items-center gap-2 px-6 py-2 bg-muted/20 border-t text-xs">
        <FileText className="w-3.5 h-3.5 text-primary" />
        <div>{insightText}</div>
      </div>
    </div>
  );
}
