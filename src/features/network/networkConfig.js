import { SIMULATION_CHART_CONFIG } from '@features/simulation/simulationConfig';

export const NETWORK_CONFIG = {
  // Choropleth color scale (interpolated from SIMULATION_CHART_CONFIG.riskZones)
  // Values are RGB arrays for Deck.gl
  choropleth: {
    safe: [34, 197, 94],      // #22c55e
    marginal: [245, 158, 11], // #f59e0b
    critical: [239, 68, 68],  // #ef4444
    gridlocked: [153, 27, 27],// #991b1b
    baseline: [148, 163, 184] // #94a3b8 - for 0 capacity loss
  },
  
  cascade: {
    originColor: [168, 85, 247], // purple-500
    footprintColor: [192, 132, 252], // purple-400
    maxOpacity: 255,
    minOpacity: 50,
  },

  roadClasses: {
    order: ['Arterial', 'Sub-Arterial', 'Collector', 'Local'],
    colors: {
      'Arterial': 'hsl(var(--chart-1))',
      'Sub-Arterial': 'hsl(var(--chart-2))',
      'Collector': 'hsl(var(--chart-3))',
      'Local': 'hsl(var(--chart-4))',
    }
  },

  viewport: {
    longitude: 77.5946,
    latitude: 12.9716,
    zoom: 11,
    minZoom: 10,
    maxZoom: 18,
    pitch: 45,
    bearing: 0
  }
};

export function interpolateColor(reductionPercentage) {
  if (reductionPercentage === 0) return NETWORK_CONFIG.choropleth.baseline;
  
  const pct = reductionPercentage / 100;
  
  // Define stops mapping to percentage thresholds
  const stops = [
    { threshold: 0, color: NETWORK_CONFIG.choropleth.safe },
    { threshold: SIMULATION_CHART_CONFIG.riskZones.safe.threshold, color: NETWORK_CONFIG.choropleth.safe },
    { threshold: SIMULATION_CHART_CONFIG.riskZones.marginal.threshold, color: NETWORK_CONFIG.choropleth.marginal },
    { threshold: 0.99, color: NETWORK_CONFIG.choropleth.critical },
    { threshold: 1.0, color: NETWORK_CONFIG.choropleth.gridlocked }
  ];

  // Find the segment we are in
  for (let i = 0; i < stops.length - 1; i++) {
    const lower = stops[i];
    const upper = stops[i + 1];
    
    if (pct >= lower.threshold && pct <= upper.threshold) {
      const range = upper.threshold - lower.threshold;
      if (range === 0) return lower.color;
      
      const factor = (pct - lower.threshold) / range;
      return [
        Math.round(lower.color[0] + factor * (upper.color[0] - lower.color[0])),
        Math.round(lower.color[1] + factor * (upper.color[1] - lower.color[1])),
        Math.round(lower.color[2] + factor * (upper.color[2] - lower.color[2])),
        255 // Alpha
      ];
    }
  }
  return NETWORK_CONFIG.choropleth.gridlocked;
}
