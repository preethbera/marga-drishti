import React from 'react';
import { Button } from '../ui/button';
import { Play, Pause, RotateCcw, Columns, Layers } from 'lucide-react';

const PRESETS = [
  { label: 'Morning Peak', range: [8, 11] },
  { label: 'Lunch', range: [12, 14] },
  { label: 'Evening Peak', range: [17, 21] },
  { label: 'Late Night', range: [22, 23] },
  { label: 'All Day', range: [0, 23] }
];

const MAP_LAYERS = ['Hexbins', 'Heatmap', 'Points', 'Impact'];

export default function ToolbarRow({ 
  currentRange, 
  onPresetSelect,
  isPlaying,
  onPlayToggle,
  onReset,
  compareMode,
  onCompareToggle,
  activeLayer,
  onLayerChange
}) {
  const isPresetActive = (presetRange) => {
    return currentRange[0] === presetRange[0] && currentRange[1] === presetRange[1];
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 px-6 w-full shrink-0">
      {/* Left side: Presets */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold uppercase text-muted-foreground mr-2">Presets:</span>
        <div className="flex items-center gap-2 flex-wrap">
          {PRESETS.map(preset => (
            <Button
              key={preset.label}
              variant={isPresetActive(preset.range) ? 'default' : 'outline'}
              className="rounded-full h-8 px-4 text-xs"
              onClick={() => onPresetSelect(preset.range)}
            >
              {preset.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Right side: Controls */}
      <div className="flex items-center gap-4 flex-wrap">
        
        {/* Playback Cluster */}
        <div className="flex items-center border rounded-md overflow-hidden">
          <Button 
            variant="ghost" 
            size="sm" 
            className={`h-8 rounded-none px-3 border-r ${isPlaying ? 'bg-primary/10 text-primary hover:bg-primary/20' : ''}`}
            onClick={onPlayToggle}
          >
            {isPlaying ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
            <span className="text-xs">{isPlaying ? 'Pause' : 'Play'}</span>
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 rounded-none hover:bg-muted"
            onClick={onReset}
            title="Reset"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>

        {/* Compare Toggle */}
        <Button 
          variant={compareMode ? 'default' : 'outline'}
          size="sm"
          className="h-8"
          onClick={onCompareToggle}
        >
          <Columns className="w-4 h-4 mr-2" />
          <span className="text-xs">{compareMode ? 'Exit Compare' : 'Compare'}</span>
        </Button>

        {/* Layer Toggle */}
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-muted-foreground" />
          <div className="flex items-center border rounded-md p-0.5 bg-muted/50">
            {MAP_LAYERS.map(layer => (
              <button
                key={layer}
                className={`px-3 py-1 text-xs rounded-sm font-medium transition-colors ${
                  activeLayer === layer 
                    ? 'bg-primary text-primary-foreground shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                }`}
                onClick={() => onLayerChange(layer)}
              >
                {layer}
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
