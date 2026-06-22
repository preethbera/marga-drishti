import { FlyToInterpolator } from '@deck.gl/core';

export const GEOSPATIAL_CONFIG = {
  MAP_STYLE: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
  
  INITIAL_VIEW_STATE: {
    longitude: 77.5946,
    latitude: 12.9716,
    zoom: 11,
    pitch: 0,
    bearing: 0,
    transitionDuration: 1000,
    transitionInterpolator: new FlyToInterpolator()
  },

  TRANSITIONS: {
    SMOOTH: {
      transitionDuration: 1500,
      transitionInterpolator: new FlyToInterpolator()
    }
  },

  LAYERS: {
    SCATTERPLOT: {
      id: 'city-wide-aggregated',
      radiusScale: 10,
      radiusMinPixels: 15,
      radiusMaxPixels: 60,
      getColor: (count, maxCount) => {
        // Heatmap color scale from blue to red based on count relative to maxCount
        const ratio = Math.min(count / (maxCount || 1), 1);
        return [
          255 * ratio,
          100,
          255 * (1 - ratio),
          200
        ];
      }
    },
    HEATMAP: {
      id: 'center-detailed-heatmap',
      radiusPixels: 40,
      intensity: 1,
      threshold: 0.1,
      colorRange: [
        [33, 102, 172],
        [103, 169, 207],
        [209, 229, 240],
        [253, 219, 199],
        [239, 138, 98],
        [178, 24, 43]
      ],
      getWeight: (vehicleType) => {
        // Physical spatial blockage (PCU mapping)
        const pcuMap = {
          'CAR': 1.0,
          'TWO_WHEELER': 0.5,
          'THREE_WHEELER': 1.0,
          'HCV': 3.0,
          'LCV': 1.5,
          'BUS': 3.0,
        };
        return pcuMap[vehicleType] || 1.0;
      }
    }
  }
};
