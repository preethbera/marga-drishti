import React from 'react';
import { Slider } from '../ui/slider';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/select';
import { Button } from '../ui/button';
import { DatePickerWithRange } from '../ui/date-range-picker';
import { Play, Pause, RotateCcw, Columns } from 'lucide-react';

const PRESETS = [
  { label: 'Morning Peak', range: [8, 11] },
  { label: 'Lunch', range: [12, 14] },
  { label: 'Evening Peak', range: [17, 21] },
  { label: 'Late Night', range: [22, 23] },
  { label: 'All Day', range: [0, 23] }
];

const MAP_LAYERS = ['Hexbins', 'Heatmap', 'Points', 'Impact'];

export default function FilterSidebar({
  filtersA,
  setFiltersA,
  filtersB,
  setFiltersB,
  compareMode,
  setCompareMode,
  activeLayer,
  setActiveLayer,
  playbackState,
  togglePlayback,
  resetPlayback
}) {
  const formatTime = (hour) => `${String(hour).padStart(2, '0')}:00`;

  const handlePresetSelect = (range) => {
    resetPlayback();
    setFiltersA({ timeRange: range });
  };

  const isPresetActive = (presetRange) => {
    return filtersA.timeRange[0] === presetRange[0] && filtersA.timeRange[1] === presetRange[1];
  };

  const renderDateTimeControls = (filters, setFilters, isSecondary = false) => (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase">Date Range</span>
        <DatePickerWithRange 
          date={filters.dateRange}
          setDate={(range) => setFilters({ dateRange: range })}
          className="w-full"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase">Day of Week</span>
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

      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase">Time Window</span>
          <div className="bg-muted px-1.5 py-0.5 rounded text-[10px] font-mono font-medium">
            {formatTime(filters.timeRange[0])} – {formatTime(filters.timeRange[1])}
          </div>
        </div>
        <div className="px-1 mt-1">
          <Slider
            min={0}
            max={23}
            step={1}
            value={filters.timeRange}
            onValueChange={(val) => setFilters({ timeRange: val })}
            className={isSecondary ? "[&_[data-slot=slider-range]]:bg-primary" : ""}
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full shrink-0 border-l bg-card h-full flex flex-col min-h-0">
      
      {/* Header */}
      <div className="p-3 border-b flex items-center justify-between shrink-0">
        <h2 className="font-semibold text-sm">Filters</h2>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 flex flex-col gap-6">
        
        {/* 1. Quick Presets (Only when NOT in Compare Mode) */}
        {!compareMode && (
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase">Quick Presets</span>
            <div className="flex flex-wrap gap-1.5">
              {PRESETS.map(preset => (
                <Button
                  key={preset.label}
                  variant={isPresetActive(preset.range) ? 'secondary' : 'outline'}
                  className="h-6 px-2.5 text-[10px] rounded-full"
                  onClick={() => handlePresetSelect(preset.range)}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* 2. Date & Time / Compare Windows */}
        {compareMode ? (
          <div className="flex flex-col gap-4">
            {/* Window A */}
            <div className="flex flex-col gap-3 p-3 border rounded-lg bg-background">
              <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-primary" />
                Window A
              </span>
              {renderDateTimeControls(filtersA, setFiltersA, false)}
            </div>
            
            {/* Window B */}
            <div className="flex flex-col gap-3 p-3 border border-primary/30 rounded-lg bg-primary/5">
              <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full border-2 border-primary" />
                Window B
              </span>
              {renderDateTimeControls(filtersB, setFiltersB, true)}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {renderDateTimeControls(filtersA, setFiltersA, false)}
            
            {/* Playback Controls */}
            <div className="flex items-center border rounded-md overflow-hidden mt-1">
              <Button 
                variant="ghost" 
                size="sm" 
                className={`flex-1 h-7 rounded-none border-r ${playbackState.isPlaying ? 'bg-primary/10 text-primary' : ''}`}
                onClick={togglePlayback}
              >
                {playbackState.isPlaying ? <Pause className="w-3.5 h-3.5 mr-1.5" /> : <Play className="w-3.5 h-3.5 mr-1.5" />}
                <span className="text-[11px] font-medium">{playbackState.isPlaying ? 'Pause' : 'Play Sequence'}</span>
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-8 rounded-none"
                onClick={resetPlayback}
                title="Reset"
              >
                <RotateCcw className="w-3 h-3" />
              </Button>
            </div>
          </div>
        )}

        {/* 3. Compare Toggle */}
        <div className="pt-4 border-t flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs font-semibold">Compare Mode</span>
            <span className="text-[10px] text-muted-foreground">Compare two time periods</span>
          </div>
          <Button 
            variant={compareMode ? 'default' : 'outline'}
            size="sm"
            className="h-7 text-xs"
            onClick={() => setCompareMode(!compareMode)}
          >
            <Columns className="w-3 h-3 mr-1.5" />
            {compareMode ? 'Exit Compare' : 'Compare'}
          </Button>
        </div>

        {/* 4. Map Layer */}
        <div className="flex flex-col gap-2 pt-4 border-t">
          <span className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase">Map Layer</span>
          <Select value={activeLayer} onValueChange={(val) => setActiveLayer(val)}>
            <SelectTrigger className="w-full text-xs h-8">
              <SelectValue placeholder="Select layer" />
            </SelectTrigger>
            <SelectContent>
              {MAP_LAYERS.map(layer => (
                <SelectItem key={layer} value={layer}>{layer}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

      </div>
    </div>
  );
}
