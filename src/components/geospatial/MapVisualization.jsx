import React, { useMemo, useState, useCallback } from 'react';
import DeckGL from '@deck.gl/react';
import { ScatterplotLayer, TextLayer } from '@deck.gl/layers';
import { HeatmapLayer } from '@deck.gl/aggregation-layers';
import Map from 'react-map-gl/maplibre';
import { GEOSPATIAL_CONFIG } from '../../core/config/geospatial';
import MapTooltip from './MapTooltip';

export default function MapVisualization({ 
  viewState, 
  onViewStateChange, 
  data, 
  isDetailed, 
  onCenterSelect 
}) {
  const [hoverInfo, setHoverInfo] = useState(null);

  const maxCount = useMemo(() => {
    if (isDetailed || !data.aggregated || data.aggregated.length === 0) return 1;
    return Math.max(...data.aggregated.map(d => d.count));
  }, [data.aggregated, isDetailed]);

  const layers = useMemo(() => {
    if (isDetailed) {
      // Render Heatmap Layer for detailed view
      return [
        new HeatmapLayer({
          id: GEOSPATIAL_CONFIG.LAYERS.HEATMAP.id,
          data: data.detailed,
          getPosition: d => [d.longitude, d.latitude],
          getWeight: d => GEOSPATIAL_CONFIG.LAYERS.HEATMAP.getWeight(d.vehicle_type),
          radiusPixels: GEOSPATIAL_CONFIG.LAYERS.HEATMAP.radiusPixels,
          intensity: GEOSPATIAL_CONFIG.LAYERS.HEATMAP.intensity,
          threshold: GEOSPATIAL_CONFIG.LAYERS.HEATMAP.threshold,
          colorRange: GEOSPATIAL_CONFIG.LAYERS.HEATMAP.colorRange,
          aggregation: 'SUM'
        })
      ];
    } else {
      // Render Aggregated Bubbles and Text for city-wide view
      const scatterLayer = new ScatterplotLayer({
        id: GEOSPATIAL_CONFIG.LAYERS.SCATTERPLOT.id,
        data: data.aggregated,
        getPosition: d => [d.longitude, d.latitude],
        getRadius: d => Math.max(
          GEOSPATIAL_CONFIG.LAYERS.SCATTERPLOT.radiusMinPixels, 
          Math.min(GEOSPATIAL_CONFIG.LAYERS.SCATTERPLOT.radiusMaxPixels, Math.sqrt(d.count) * GEOSPATIAL_CONFIG.LAYERS.SCATTERPLOT.radiusScale)
        ),
        getFillColor: d => GEOSPATIAL_CONFIG.LAYERS.SCATTERPLOT.getColor(d.count, maxCount),
        getLineColor: [255, 255, 255, 100],
        lineWidthMinPixels: 1,
        radiusUnits: 'pixels',
        pickable: true,
        autoHighlight: true,
        highlightColor: [255, 255, 255, 200],
        onHover: info => setHoverInfo(info),
        onClick: info => {
          if (info.object && onCenterSelect) {
            onCenterSelect(info.object);
          }
        },
        transitions: {
          getRadius: GEOSPATIAL_CONFIG.TRANSITIONS.SMOOTH.transitionDuration,
          getFillColor: GEOSPATIAL_CONFIG.TRANSITIONS.SMOOTH.transitionDuration
        }
      });

      const textLayer = new TextLayer({
        id: 'city-wide-text',
        data: data.aggregated,
        getPosition: d => [d.longitude, d.latitude],
        getText: d => d.count >= 1000 ? `${(d.count / 1000).toFixed(1)}k` : String(d.count),
        getSize: 12,
        getColor: [255, 255, 255, 255],
        getAlignmentBaseline: 'center',
        getTextAnchor: 'middle',
        fontFamily: 'Inter, sans-serif',
        fontWeight: 'bold',
        pickable: false,
      });

      return [scatterLayer, textLayer];
    }
  }, [isDetailed, data, maxCount, onCenterSelect]);

  const handleViewStateChange = useCallback(({ viewState: newVS }) => {
    onViewStateChange(newVS);
  }, [onViewStateChange]);

  return (
    <div className="flex-1 relative w-full h-full bg-background" onMouseLeave={() => setHoverInfo(null)}>
      <DeckGL
        layers={layers}
        initialViewState={viewState}
        viewState={viewState}
        onViewStateChange={handleViewStateChange}
        controller={true}
        getCursor={({ isDragging, isHovering }) => isDragging ? 'grabbing' : isHovering ? 'pointer' : 'grab'}
      >
        <Map 
          mapStyle={GEOSPATIAL_CONFIG.MAP_STYLE} 
          reuseMaps
          preventStyleDiffing={true}
        />
        
        {hoverInfo && hoverInfo.object && (
          <MapTooltip 
            object={hoverInfo.object} 
            x={hoverInfo.x} 
            y={hoverInfo.y} 
            isDetailed={isDetailed} 
          />
        )}
      </DeckGL>
    </div>
  );
}
