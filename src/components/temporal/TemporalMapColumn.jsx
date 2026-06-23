import React, { useMemo } from 'react';
import AnalyticsMap from '../ui/analytics-map';
import { GEOSPATIAL_CONFIG, getDynamicViewState } from '../../core/config/map';
import { Layers, Home } from 'lucide-react';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

export default function TemporalMapColumn({ 
  compareMode, 
  activeLayer, 
  setActiveLayer,
  viewState, 
  onViewStateChange, 
  dataA, 
  dataB, 
  filtersA, 
  filtersB,
  isPlaying
}) {
  const onResetCamera = () => {
    const mapContainer = document.getElementById('temporal-map-container');
    const w = mapContainer ? mapContainer.clientWidth : 800;
    const h = mapContainer ? mapContainer.clientHeight : 600;
    onViewStateChange(getDynamicViewState(dataA?.violations, w, h));
  };

  const renderOverlayBadge = (title, filters, kpis, isA) => {
    return (
      <div className="absolute top-4 left-4 z-10 bg-background/80 backdrop-blur-md border rounded-md p-3 shadow-sm flex flex-col gap-1.5 max-w-[250px]">
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-bold uppercase tracking-wider ${isA ? (compareMode ? 'text-foreground' : 'text-muted-foreground') : 'text-primary'}`}>
            {title}
          </span>
          {isA && isPlaying && (
            <div className="flex items-center gap-1 bg-destructive/10 text-destructive px-1.5 py-0.5 rounded text-[10px] font-bold">
              <div className="w-1.5 h-1.5 bg-destructive rounded-full animate-pulse" />
              LIVE
            </div>
          )}
        </div>
        <div className="text-sm font-semibold truncate">
          {String(filters.timeRange[0]).padStart(2, '0')}:00 – {String(filters.timeRange[1]).padStart(2, '0')}:00 · {filters.dayOfWeek}
        </div>
        <div className="text-xs text-muted-foreground flex items-center justify-between">
          <span>{kpis?.violationsInWindow?.toLocaleString() || 0} violations</span>
          {!isA && compareMode && dataA?.kpis && kpis && (
            <span className={kpis.violationsInWindow > dataA.kpis.violationsInWindow ? 'text-destructive font-medium' : 'text-success font-medium'}>
              {kpis.violationsInWindow > dataA.kpis.violationsInWindow ? '+' : ''}
              {Math.round(((kpis.violationsInWindow - dataA.kpis.violationsInWindow) / dataA.kpis.violationsInWindow) * 100)}% vs A
            </span>
          )}
        </div>
      </div>
    );
  };

  const renderLegend = () => {
    if (activeLayer === 'Points') return null;
    
    let title = 'Violation Count';
    let gradient = 'from-violet-100 to-violet-900';
    let rightLabel = 'High';
    
    if (activeLayer === 'Heatmap') {
      title = 'Violation Density';
      gradient = 'from-blue-500 via-yellow-200 to-red-600';
    } else if (activeLayer === 'Impact') {
      title = 'Congestion Impact';
      gradient = 'from-amber-100 to-red-600';
      rightLabel = 'High (peak ×1.8)';
    }

    return (
      <div className="absolute bottom-4 right-4 z-10 bg-background/80 backdrop-blur-md border rounded-md p-3 shadow-sm flex flex-col gap-2 w-48">
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{title}</span>
        <div className={`h-2.5 w-full rounded-sm bg-gradient-to-r ${gradient}`} />
        <div className="flex justify-between text-[10px] text-muted-foreground font-medium">
          <span>Low</span>
          <span>{rightLabel}</span>
        </div>
      </div>
    );
  };

  return (
    <div id="temporal-map-container" className="flex-1 flex flex-col w-full h-full relative border rounded-lg overflow-hidden bg-muted/20">
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        <Select value={activeLayer} onValueChange={setActiveLayer}>
          <SelectTrigger className="w-32 !h-9 bg-background hover:bg-background dark:bg-background dark:hover:bg-background border rounded-md shadow-sm font-semibold focus:ring-0 focus:ring-offset-0">
            <div className="flex items-center">
              <Layers className="w-4 h-4 text-muted-foreground mr-2 shrink-0" />
              <SelectValue placeholder="Layer" />
            </div>
          </SelectTrigger>
          <SelectContent position="popper" side="bottom" sideOffset={4} alignItemWithTrigger={false} className="bg-background dark:bg-background">
            <SelectItem value="Hexbins">3D Hex</SelectItem>
            <SelectItem value="Heatmap">Heatmap</SelectItem>
            <SelectItem value="Points">Points</SelectItem>
            <SelectItem value="Impact">Impact</SelectItem>
          </SelectContent>
        </Select>
        
        <Button 
          variant="outline" 
          size="icon" 
          className="rounded-md shadow-sm bg-background dark:bg-background hover:bg-accent dark:hover:bg-accent h-9 w-9"
          onClick={onResetCamera}
          title="Fit to Data"
        >
          <Home className="w-4 h-4" />
        </Button>
      </div>

      {/* Single Map or Top Map (Window A) */}
      <div className="relative w-full flex-1">
        <AnalyticsMap 
          className="w-full h-full relative"
          layerConfigs={[{ id: `temporal-${activeLayer.toLowerCase()}-a`, type: activeLayer, data: dataA?.violations }]}
          viewState={viewState} 
          onViewStateChange={onViewStateChange}
        >
          {renderOverlayBadge(compareMode ? 'Window A' : 'Currently viewing', filtersA, dataA?.kpis, true)}
          {!compareMode && renderLegend()}
        </AnalyticsMap>
      </div>

      {/* Bottom Map (Window B) - Only in Compare Mode */}
      {compareMode && (
        <>
          <div className="h-1.5 w-full bg-border shrink-0" />
          <div className="relative w-full flex-1 border-t-2 border-primary/50">
            <AnalyticsMap 
              className="w-full h-full relative"
              layerConfigs={[{ id: `temporal-${activeLayer.toLowerCase()}-b`, type: activeLayer, data: dataB?.violations }]}
              viewState={viewState} 
              onViewStateChange={onViewStateChange}
            >
              {renderOverlayBadge('Window B', filtersB, dataB?.kpis, false)}
              {renderLegend()}
            </AnalyticsMap>
          </div>
        </>
      )}
    </div>
  );
}
