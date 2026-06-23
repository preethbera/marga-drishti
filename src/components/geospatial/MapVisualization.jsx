import React, { useState, useMemo } from 'react';
import { BaseMap } from '../ui/base-map';
import { HexagonLayer, HeatmapLayer } from '@deck.gl/aggregation-layers';
import { ScatterplotLayer, TextLayer } from '@deck.gl/layers';
import { GEOSPATIAL_CONFIG } from '../../core/config/geospatial';
import { Layers, MapPin, Activity, Home, ArrowLeft } from 'lucide-react';
import { Button } from '../ui/button';
import { useGeospatialStore } from '../../store/useGeospatialStore';

export default function MapVisualization({ viewState, onViewStateChange, isDetailed, onCenterSelect }) {
  const { mapAggregated, mapDetailed, top10, mappings } = useGeospatialStore(state => state.data);
  const filters = useGeospatialStore(state => state.filters);
  const [activeLayerMode, setActiveLayerMode] = useState('Hexbins'); // 'Hexbins', 'Bubbles', 'Heatmap'

  const onResetCamera = () => {
    onViewStateChange(GEOSPATIAL_CONFIG.INITIAL_VIEW_STATE);
  };

  const centerName = useMemo(() => {
    if (!isDetailed) return '';
    return mappings.centers.find(c => c.code === filters.centerCode)?.name || 'Centre';
  }, [isDetailed, filters.centerCode, mappings.centers]);

  const layers = useMemo(() => {
    const layerList = [];

    if (!isDetailed) {
      // --- CITY WIDE LAYERS ---
      if (activeLayerMode === 'Hexbins') {
        if (mapDetailed) {
          layerList.push(
            new HexagonLayer({
              id: 'city-hex',
              data: mapDetailed, // We need detailed data to bin into hexes
              getPosition: d => [d.longitude, d.latitude],
              getElevationWeight: d => 1,
              getColorWeight: d => 1,
              elevationScale: 50,
              radius: 200,
              extruded: true,
              pickable: true,
              colorRange: GEOSPATIAL_CONFIG.LAYERS.HEXBINS.colorRange,
            })
          );
        }
        
        // Floating Top-5 Labels (if we have top10 data)
        if (top10 && top10.code && top10.code.length > 0) {
          // We need coordinates for the top 5. We can join them from mapAggregated.
          const top5 = [];
          for (let i = 0; i < Math.min(5, top10.code.length); i++) {
            const code = top10.code[i];
            // Find in mapAggregated
            if (mapAggregated && mapAggregated.code) {
              const idx = mapAggregated.code.indexOf(code);
              if (idx !== -1) {
                top5.push({
                  position: [mapAggregated.longitude[idx], mapAggregated.latitude[idx]],
                  text: `${top10.name[i]}  ${top10.count[i].toLocaleString()}`,
                });
              }
            }
          }
          if (top5.length > 0) {
            layerList.push(
              new TextLayer({
                id: 'top-5-labels',
                data: top5,
                getPosition: d => d.position,
                getText: d => d.text,
                getSize: 14,
                getColor: [255, 255, 255],
                getBackgroundColor: [30, 30, 30, 200],
                background: true,
                backgroundPadding: [8, 4],
                borderRadius: 12,
                getPixelOffset: [0, -30], // float above
                fontFamily: 'Inter, sans-serif',
                fontWeight: 'bold',
                parameters: { depthTest: false } // Always float on top
              })
            );
          }
        }
      } 
      else if (activeLayerMode === 'Bubbles') {
        if (mapAggregated) {
          // Calculate max count for scaling radius
          const counts = mapAggregated.count ? Array.from(mapAggregated.count) : [];
          const maxCount = counts.length > 0 ? Math.max(...counts, 1) : 1;

          layerList.push(
            new ScatterplotLayer({
              id: 'city-bubbles',
              data: mapAggregated,
              getPosition: d => [d.longitude, d.latitude],
              getRadius: d => Math.sqrt(d.count) * 20, // scale by sqrt
              getFillColor: d => {
                // Pale to deep purple
                const intensity = d.count / maxCount;
                return [147, 51, 234, 100 + (intensity * 155)]; // tailwind purple-600 RGB with alpha
              },
              pickable: true,
              onClick: ({ object }) => {
                if (object && object.code) {
                  onCenterSelect({ code: object.code, name: object.name });
                }
              }
            })
          );
        }
      }
      else if (activeLayerMode === 'Heatmap') {
        if (mapDetailed) {
          layerList.push(
            new HeatmapLayer({
              id: 'city-heatmap',
              data: mapDetailed,
              getPosition: d => [d.longitude, d.latitude],
              getWeight: d => 1,
              radiusPixels: 40,
              intensity: 1,
              threshold: 0.05,
              colorRange: GEOSPATIAL_CONFIG.LAYERS.HEATMAP.colorRange
            })
          );
        }
      }
    } else {
      // --- DRILL DOWN LAYERS ---
      if (activeLayerMode === 'Hexbins') {
        if (mapDetailed) {
          layerList.push(
            new HexagonLayer({
              id: 'drill-hex',
              data: mapDetailed,
              getPosition: d => [d.longitude, d.latitude],
              getElevationWeight: d => 1,
              getColorWeight: d => 1,
              elevationScale: 20,
              radius: 90, // tighter bins for drill-down
              extruded: true,
              pickable: true,
              colorRange: GEOSPATIAL_CONFIG.LAYERS.HEXBINS.colorRange,
            })
          );
        }
      } 
      else if (activeLayerMode === 'Bubbles') {
        // Raw points in drill down
        if (mapDetailed) {
          layerList.push(
            new ScatterplotLayer({
              id: 'drill-points',
              data: mapDetailed,
              getPosition: d => [d.longitude, d.latitude],
              getRadius: 15,
              getFillColor: [147, 51, 234, 180], // solid purple dot
              pickable: true,
            })
          );
        }
      }
      else if (activeLayerMode === 'Heatmap') {
        if (mapDetailed) {
          layerList.push(
            new HeatmapLayer({
              id: 'drill-heatmap',
              data: mapDetailed,
              getPosition: d => [d.longitude, d.latitude],
              getWeight: d => 1,
              radiusPixels: 30,
              intensity: 2,
              threshold: 0.1,
              colorRange: GEOSPATIAL_CONFIG.LAYERS.HEATMAP.colorRange
            })
          );
        }
      }
    }

    return layerList;
  }, [activeLayerMode, isDetailed, mapAggregated, mapDetailed, top10, onCenterSelect]);

  const renderLayerControls = () => {
    return (
      <div className="absolute top-4 right-4 z-20 flex gap-2">
        <div className="flex bg-background/90 backdrop-blur-md border rounded-full shadow-sm p-1">
          <button
            onClick={() => setActiveLayerMode('Hexbins')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${activeLayerMode === 'Hexbins' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Layers className="w-3.5 h-3.5" />
            3D Hex
          </button>
          <button
            onClick={() => setActiveLayerMode('Bubbles')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${activeLayerMode === 'Bubbles' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <MapPin className="w-3.5 h-3.5" />
            {isDetailed ? 'Points' : 'Bubbles'}
          </button>
          <button
            onClick={() => setActiveLayerMode('Heatmap')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${activeLayerMode === 'Heatmap' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Activity className="w-3.5 h-3.5" />
            Heatmap
          </button>
        </div>
        
        <Button 
          variant="secondary" 
          size="icon" 
          className="rounded-full shadow-sm bg-background/90 backdrop-blur-md"
          onClick={onResetCamera}
          title="Home View"
        >
          <Home className="w-4 h-4" />
        </Button>
      </div>
    );
  };

  const renderDrillDownOverlay = () => {
    if (!isDetailed) return null;
    return (
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-2 pointer-events-none">
        <button 
          onClick={() => onCenterSelect({ code: 'all', name: 'All Centers' })}
          className="pointer-events-auto bg-foreground text-background hover:bg-foreground/90 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors w-fit"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to city view
        </button>
        <div className="bg-card/90 backdrop-blur-md border rounded-md p-3 shadow-sm flex flex-col max-w-[250px]">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Drill-Down</span>
          <span className="font-bold text-base leading-tight truncate">{centerName}</span>
        </div>
      </div>
    );
  };

  const renderLegend = () => {
    let title = 'Violation Volume';
    let gradient = 'from-violet-100 to-violet-900';
    
    if (activeLayerMode === 'Bubbles') {
      title = isDetailed ? 'Raw Violations' : 'Violations per Centre';
      gradient = 'from-violet-100 to-violet-900';
    } else if (activeLayerMode === 'Heatmap') {
      title = 'Violation Density';
      gradient = 'from-map-cyan via-map-purple to-map-pink';
    }

    if (activeLayerMode === 'Bubbles' && isDetailed) return null; // No legend needed for raw point scatter

    return (
      <div className="absolute bottom-6 right-6 z-10 bg-background/90 backdrop-blur-md border rounded-md p-3 shadow-sm flex flex-col gap-2 w-48">
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{title}</span>
        <div className={`h-2.5 w-full rounded-sm bg-gradient-to-r ${gradient}`} />
        <div className="flex justify-between text-[10px] text-muted-foreground font-medium">
          <span>Low</span>
          <span>High</span>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-full relative overflow-hidden bg-muted/20">
      <BaseMap 
        layers={layers} 
        viewState={viewState} 
        onViewStateChange={onViewStateChange}
        // Carto Voyager Basemap per specs
        mapStyle="https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json"
      />
      {renderLayerControls()}
      {renderDrillDownOverlay()}
      {renderLegend()}
    </div>
  );
}
