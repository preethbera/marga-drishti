import React, { useMemo } from 'react';
import { BaseMap } from '../ui/base-map';
import { HexagonLayer, HeatmapLayer } from '@deck.gl/aggregation-layers';
import { ScatterplotLayer } from '@deck.gl/layers';
import { GEOSPATIAL_CONFIG } from '../../core/config/geospatial';
import { Crosshair } from 'lucide-react';
import { Button } from '../ui/button';

export default function TemporalMapColumn({ 
  compareMode, 
  activeLayer, 
  viewState, 
  onViewStateChange, 
  dataA, 
  dataB, 
  filtersA, 
  filtersB,
  isPlaying
}) {
  const onResetCamera = () => {
    onViewStateChange(GEOSPATIAL_CONFIG.INITIAL_VIEW_STATE);
  };

  const createLayer = (data, windowId) => {
    if (!data || data.length === 0) return null;
    
    const layerId = `${activeLayer.toLowerCase()}-${windowId}`;

    switch (activeLayer) {
      case 'Hexbins':
        return new HexagonLayer({
          ...GEOSPATIAL_CONFIG.LAYERS.HEXBINS,
          id: layerId,
          data,
          getPosition: d => [d.longitude, d.latitude],
          getElevationWeight: d => 1,
          getColorWeight: d => 1,
          pickable: true
        });
      
      case 'Heatmap':
        return new HeatmapLayer({
          ...GEOSPATIAL_CONFIG.LAYERS.HEATMAP,
          id: layerId,
          data,
          getPosition: d => [d.longitude, d.latitude],
          getWeight: d => GEOSPATIAL_CONFIG.LAYERS.HEATMAP.getWeight(d.vehicle_type),
          aggregation: 'SUM'
        });
        
      case 'Points':
        return new ScatterplotLayer({
          ...GEOSPATIAL_CONFIG.LAYERS.POINTS,
          id: layerId,
          data,
          getPosition: d => [d.longitude, d.latitude],
          getRadius: 10,
          pickable: true
        });

      case 'Impact':
        return new HexagonLayer({
          ...GEOSPATIAL_CONFIG.LAYERS.IMPACT,
          id: layerId,
          data,
          getPosition: d => [d.longitude, d.latitude],
          getElevationWeight: d => GEOSPATIAL_CONFIG.LAYERS.IMPACT.getWeight(d.hour),
          getColorWeight: d => GEOSPATIAL_CONFIG.LAYERS.IMPACT.getWeight(d.hour),
          pickable: true
        });
        
      default:
        return null;
    }
  };

  const layersA = useMemo(() => [createLayer(dataA?.violations, 'a')].filter(Boolean), [activeLayer, dataA]);
  const layersB = useMemo(() => [createLayer(dataB?.violations, 'b')].filter(Boolean), [activeLayer, dataB]);

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
    <div className="flex-1 flex flex-col w-full h-full relative border rounded-lg overflow-hidden bg-muted/20">
      <Button 
        variant="secondary" 
        size="icon" 
        className="absolute top-4 right-4 z-20 shadow-md bg-background/80 backdrop-blur"
        onClick={onResetCamera}
        title="Reset Camera"
      >
        <Crosshair className="w-4 h-4" />
      </Button>

      {/* Single Map or Top Map (Window A) */}
      <div className="relative w-full flex-1">
        <BaseMap 
          layers={layersA} 
          viewState={viewState} 
          onViewStateChange={onViewStateChange}
        />
        {renderOverlayBadge(compareMode ? 'Window A' : 'Currently viewing', filtersA, dataA?.kpis, true)}
        {!compareMode && renderLegend()}
      </div>

      {/* Bottom Map (Window B) - Only in Compare Mode */}
      {compareMode && (
        <>
          <div className="h-1.5 w-full bg-border shrink-0" />
          <div className="relative w-full flex-1 border-t-2 border-primary/50">
            <BaseMap 
              layers={layersB} 
              viewState={viewState} 
              onViewStateChange={onViewStateChange}
            />
            {renderOverlayBadge('Window B', filtersB, dataB?.kpis, false)}
            {renderLegend()}
          </div>
        </>
      )}
    </div>
  );
}
