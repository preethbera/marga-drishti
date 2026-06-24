import { HexagonLayer, HeatmapLayer } from '@deck.gl/aggregation-layers';
import { ScatterplotLayer, TextLayer } from '@deck.gl/layers';
import { GEOSPATIAL_CONFIG } from '../config/map';

/**
 * Pure layer builder factory for Deck.gl map layers.
 * Decoupled from React UI.
 */

export function buildHexbinLayer(id, data, overrides = {}) {
  if (!data || data.length === 0) return null;
  return new HexagonLayer({
    ...GEOSPATIAL_CONFIG.LAYERS.HEXBINS,
    id,
    data,
    getPosition: (_, {index, data}) => [data.longitude[index], data.latitude[index]],
    getElevationWeight: () => 1,
    getColorWeight: () => 1,
    pickable: true,
    ...overrides
  });
}

export function buildHeatmapLayer(id, data, overrides = {}) {
  if (!data || data.length === 0) return null;
  return new HeatmapLayer({
    ...GEOSPATIAL_CONFIG.LAYERS.HEATMAP,
    id,
    data,
    getPosition: (_, {index, data}) => [data.longitude[index], data.latitude[index]],
    getWeight: (_, {index, data}) => GEOSPATIAL_CONFIG.LAYERS.HEATMAP.getWeight(data.vehicle_type ? data.vehicle_type[index] : null),
    aggregation: 'SUM',
    ...overrides
  });
}

export function buildImpactLayer(id, data, overrides = {}) {
  if (!data || data.length === 0) return null;
  return new HexagonLayer({
    ...GEOSPATIAL_CONFIG.LAYERS.IMPACT,
    id,
    data,
    getPosition: (_, {index, data}) => [data.longitude[index], data.latitude[index]],
    getElevationWeight: (_, {index, data}) => GEOSPATIAL_CONFIG.LAYERS.IMPACT.getWeight(Number(data.hour_val[index])),
    getColorWeight: (_, {index, data}) => GEOSPATIAL_CONFIG.LAYERS.IMPACT.getWeight(Number(data.hour_val[index])),
    pickable: true,
    ...overrides
  });
}

export function buildPointsLayer(id, data, overrides = {}) {
  if (!data || data.length === 0) return null;
  return new ScatterplotLayer({
    ...GEOSPATIAL_CONFIG.LAYERS.POINTS,
    id,
    data,
    getPosition: (_, {index, data}) => [data.longitude[index], data.latitude[index]],
    pickable: true,
    ...overrides
  });
}

export function buildBubblesLayer(id, data, maxCount, onClick) {
  if (!data || data.length === 0) return [];
  
  const bubbleLayer = new ScatterplotLayer({
    ...GEOSPATIAL_CONFIG.LAYERS.BUBBLES,
    id,
    data,
    getPosition: (_, {index, data}) => [data.longitude[index], data.latitude[index]],
    getRadius: (_, {index, data}) => {
      // Linear mapping of Area to Count => r = r_max * sqrt(count / maxCount)
      const count = Number(data.count[index]);
      const maxAreaRadius = 60; // Fixed pixel size for the absolute highest count
      const ratio = count / (maxCount || 1);
      return maxAreaRadius * Math.sqrt(ratio);
    },
    getFillColor: (_, {index, data}) => GEOSPATIAL_CONFIG.LAYERS.BUBBLES.calculateColor(Number(data.count[index]), maxCount),
    pickable: true,
    onClick,
  });

  const textLayer = new TextLayer({
    id: `${id}-text`,
    data,
    getPosition: (_, {index, data}) => [data.longitude[index], data.latitude[index]],
    getText: (_, {index, data}) => Number(data.count[index]).toLocaleString(),
    getSize: 12,
    getColor: [255, 255, 255, 255],
    fontFamily: 'Inter, sans-serif',
    fontWeight: 'bold',
    getTextAnchor: 'middle',
    getAlignmentBaseline: 'center',
    parameters: { depthTest: false }, // Always render text on top of bubbles
  });

  return [bubbleLayer, textLayer];
}

export function buildTopLabelsLayer(id, topData, sourceMapData) {
  if (!topData || !topData.code || topData.code.length === 0) return null;
  if (!sourceMapData || !sourceMapData.code) return null;

  const top5 = [];
  for (let i = 0; i < Math.min(5, topData.code.length); i++) {
    const code = topData.code[i];
    // Find coordinates using indexOf on the binary string array
    const idx = sourceMapData.code.indexOf(code);
    if (idx !== -1) {
      top5.push({
        position: [sourceMapData.longitude[idx], sourceMapData.latitude[idx]],
        text: `${topData.name[i]}  ${Number(topData.count[i]).toLocaleString()}`,
      });
    }
  }

  if (top5.length === 0) return null;

  return new TextLayer({
    id,
    data: top5,
    getPosition: d => d.position,
    getText: d => d.text,
    getSize: 14,
    getColor: [255, 255, 255],
    getBackgroundColor: [30, 30, 30, 200],
    background: true,
    backgroundPadding: [8, 4],
    borderRadius: 12,
    getPixelOffset: [0, -30], 
    fontFamily: 'Inter, sans-serif',
    fontWeight: 'bold',
    parameters: { depthTest: false }
  });
}
