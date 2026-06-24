import React, { useEffect } from 'react';
import { useNetworkStore } from '@/store/useNetworkStore';
import { Calendar as CalendarIcon, RotateCcw } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

const ROAD_CLASSES = [
  { id: 'arterial', label: 'Arterial' },
  { id: 'sub_arterial', label: 'Sub-Arterial' },
  { id: 'collector', label: 'Collector' },
  { id: 'local', label: 'Local' }
];

export default function NetworkFilterBar() {
  const { startDate, endDate, roadClasses, setFilters, toggleRoadClass, clearFilters, fetchData } = useNetworkStore();

  // Load data on mount if not already loaded
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDateSelect = (type, date) => {
    if (!date) return;
    const dateStr = date.toISOString().split('T')[0];
    if (type === 'start') {
      setFilters({ startDate: dateStr, endDate });
    } else {
      setFilters({ startDate, endDate: dateStr });
    }
  };

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-card border rounded-lg shadow-sm">
      <div className="flex items-center gap-4">
        {/* Date Pickers */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground mr-2">Time Window:</span>
          
          <Popover>
            <PopoverTrigger render={<Button variant="outline" className="w-[140px] pl-3 text-left font-normal bg-background" />}>
              {startDate ? format(new Date(startDate), "MMM d, yyyy") : <span>Start date</span>}
              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={new Date(startDate)}
                onSelect={(date) => handleDateSelect('start', date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <span className="text-muted-foreground text-sm">to</span>

          <Popover>
            <PopoverTrigger render={<Button variant="outline" className="w-[140px] pl-3 text-left font-normal bg-background" />}>
              {endDate ? format(new Date(endDate), "MMM d, yyyy") : <span>End date</span>}
              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={new Date(endDate)}
                onSelect={(date) => handleDateSelect('end', date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="w-px h-6 bg-border mx-2 hidden md:block"></div>

        {/* Road Classes */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground mr-2">Road Classes:</span>
          {ROAD_CLASSES.map(cls => (
            <button
              key={cls.id}
              onClick={() => toggleRoadClass(cls.id)}
              className={`px-3 py-1 text-xs font-medium rounded-full transition-colors border ${
                roadClasses.includes(cls.id) 
                  ? 'bg-primary text-primary-foreground border-primary' 
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted border-border'
              }`}
            >
              {cls.label}
            </button>
          ))}
        </div>
      </div>

      <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground hover:text-foreground">
        <RotateCcw className="w-4 h-4 mr-2" />
        Reset Filters
      </Button>
    </div>
  );
}
