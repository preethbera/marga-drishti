import React, { useMemo } from 'react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { SearchableCombobox } from '../ui/searchable-combobox';
import { RefreshCcw, FileText } from 'lucide-react';
import { useGeospatialStore } from '../../store/useGeospatialStore';

function formatNumber(num) {
  if (num == null) return '0';
  return num.toLocaleString();
}

export default function FilterBar({ filters, mappings, onFilterChange, onReset }) {
  const { mapAggregated, top10, drillDownStats, topOffences } = useGeospatialStore((state) => state.data);
  const isDrillDown = filters.centerCode !== 'all';

  return (
    <div className="flex flex-col w-full bg-card border-b shrink-0 z-20 shadow-sm relative">
      {/* Top Row: Title + Filters */}
      <div className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">Global Filters</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-[200px]">
            <SearchableCombobox
              items={mappings.centers}
              value={filters.centerCode}
              onSelect={(val) => onFilterChange({ centerCode: val })}
              placeholder="Search Centre..."
              emptyText="No centre found."
            />
          </div>

          <div className="w-[220px]">
            <SearchableCombobox
              items={mappings.offences}
              value={filters.offenceCode}
              onSelect={(val) => onFilterChange({ offenceCode: val })}
              placeholder="Search Offence..."
              emptyText="No offence found."
            />
          </div>

          <div className="w-[180px]">
            <SearchableCombobox
              items={mappings.vehicles}
              value={filters.vehicleType}
              onSelect={(val) => onFilterChange({ vehicleType: val })}
              placeholder="Vehicle Type..."
              emptyText="No vehicle found."
            />
          </div>

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

    </div>
  );
}
