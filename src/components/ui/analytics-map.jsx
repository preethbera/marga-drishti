import React, { useMemo } from 'react';
import { BaseMap } from './base-map';
import { GEOSPATIAL_CONFIG } from '../../core/config/map';
import { 
  buildBubblesLayer, 
  buildHeatmapLayer, 
  buildHexbinLayer, 
  buildImpactLayer, 
  buildPointsLayer,
  buildTopLabelsLayer
} from '../../core/engine/mapLayers';

/**
 * Universal tooltip renderer for AnalyticsMap
 */
function getMapTooltip({ index, layer }) {
  if (index !== undefined && index !== -1) {
    const data = layer.props.data;

    // Heatmaps and Hexbins use internal aggregation logic, so we skip tooltips for them here unless specifically configured.
    // However, Bubbles (ScatterplotLayer) provide direct row-level access.
    if (layer.id.toLowerCase().includes('bubbles') && data && data.name && data.count) {
      return {
        html: `
          <div style="font-family: 'Inter', sans-serif; display: flex; flex-direction: column; gap: 4px;">
            <div style="font-weight: 700; font-size: 13px; color: #fff;">${data.code[index]} — ${data.name[index]}</div>
            <div style="color: #a1a1aa; font-size: 12px;"><strong style="color: #fff;">${Number(data.count[index]).toLocaleString()}</strong> violations</div>
          </div>
        `,
        style: {
          backgroundColor: 'rgba(24, 24, 27, 0.95)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '6px',
          color: '#fff',
          padding: '8px 12px',
          backdropFilter: 'blur(4px)',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
        }
      };
    }
  }
  return null;
}

/**
 * Presentational generic AnalyticsMap component.
 * Expects a declarative array of `layerConfigs`.
 * Contains NO business or filtering logic.
 */
export default function AnalyticsMap({ 
  viewState, 
  onViewStateChange, 
  layerConfigs = [], 
  children,
  className = "w-full h-full relative overflow-hidden bg-muted/20"
}) {
  const layers = useMemo(() => {
    let finalLayers = [];

    for (const config of layerConfigs) {
      const { id, type, data, overrides = {}, extras = {} } = config;
      
      switch (type) {
        case 'Bubbles': {
          const maxCount = extras.maxCount || 1;
          const bubbleLayers = buildBubblesLayer(id, data, maxCount, overrides.onClick);
          if (bubbleLayers) finalLayers.push(...bubbleLayers);
          
          if (extras.top10Data) {
             const labelLayer = buildTopLabelsLayer(`${id}-labels`, extras.top10Data, data);
             if (labelLayer) finalLayers.push(labelLayer);
          }
          break;
        }
        case 'Hexbins': {
          const layer = buildHexbinLayer(id, data, overrides);
          if (layer) finalLayers.push(layer);
          break;
        }
        case 'Heatmap': {
          const layer = buildHeatmapLayer(id, data, overrides);
          if (layer) finalLayers.push(layer);
          break;
        }
        case 'Points': {
          const layer = buildPointsLayer(id, data, overrides);
          if (layer) finalLayers.push(layer);
          break;
        }
        case 'Impact': {
          const layer = buildImpactLayer(id, data, overrides);
          if (layer) finalLayers.push(layer);
          break;
        }
        default:
          break;
      }
    }

    return finalLayers;
  }, [layerConfigs]);

  return (
    <div className={className}>
      <BaseMap 
        layers={layers}
        viewState={viewState} 
        onViewStateChange={onViewStateChange}
        getTooltip={getMapTooltip}
        mapStyle={GEOSPATIAL_CONFIG.MAP_STYLE}
      >
        {children}
      </BaseMap>
    </div>
  );
}
