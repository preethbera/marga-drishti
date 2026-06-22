import React from 'react';
import { Button } from "@components/ui/button";
import { SearchableCombobox } from '@components/ui/searchable-combobox';
import { RefreshCcw } from 'lucide-react';

export default function FilterBar({ 
  filters, 
  mappings, 
  onFilterChange, 
  onReset 
}) {
  return (
    <div className="flex-none bg-card border-b px-6 py-3 flex flex-wrap items-center justify-between gap-4 z-10 shadow-sm">
      <div className="flex flex-wrap items-center gap-4 flex-1">
        <div className="flex-1 min-w-[200px]">
          <SearchableCombobox 
            items={mappings.centers}
            value={filters.centerCode}
            onSelect={(val) => onFilterChange({ centerCode: val })}
            placeholder="Search Center"
            emptyText="No center found."
          />
        </div>
        <div className="flex-1 min-w-[200px]">
          <SearchableCombobox 
            items={mappings.offences}
            value={filters.offenceCode}
            onSelect={(val) => onFilterChange({ offenceCode: val })}
            placeholder="Search Offence"
            emptyText="No offence found."
          />
        </div>
        <div className="flex-1 min-w-[200px]">
          <SearchableCombobox 
            items={mappings.vehicles}
            value={filters.vehicleType}
            onSelect={(val) => onFilterChange({ vehicleType: val })}
            placeholder="Search Vehicle Type"
            emptyText="No vehicle type found."
          />
        </div>
      </div>
      
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={onReset} 
        className="text-muted-foreground hover:text-foreground shrink-0"
      >
        <RefreshCcw className="w-4 h-4 mr-2" />
        Reset
      </Button>
    </div>
  );
}
