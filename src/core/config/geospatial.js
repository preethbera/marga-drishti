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
    },
    HEXBINS: {
      id: 'temporal-hexbins',
      radius: 200,
      elevationScale: 5,
      extruded: true,
      colorRange: [
        [243, 232, 255], // Lavender (low)
        [216, 180, 254],
        [192, 132, 252],
        [168, 85, 247],
        [147, 51, 234],
        [126, 34, 206]   // Deep Purple (high)
      ]
    },
    POINTS: {
      id: 'temporal-points',
      radiusMinPixels: 2,
      radiusMaxPixels: 6,
      getFillColor: [147, 51, 234, 200], // Purple
      getLineColor: [255, 255, 255, 50],
      lineWidthMinPixels: 1
    },
    IMPACT: {
      id: 'temporal-impact',
      radius: 200,
      elevationScale: 10, // Higher scale for impact
      extruded: true,
      colorRange: [
        [254, 243, 199], // Warm Cream (low impact)
        [253, 230, 138],
        [252, 211, 77],
        [251, 191, 36],
        [245, 158, 11],
        [220, 38, 38]    // Red (high impact)
      ],
      getWeight: (hour) => {
        // Impact weighting (heavier during peak 8-11 and 17-21)
        const isPeak = (hour >= 8 && hour <= 11) || (hour >= 17 && hour <= 21);
        return isPeak ? 1.8 : 1.0;
      }
    }
  }
};
