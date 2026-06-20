import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import DeckGL from '@deck.gl/react';
import { ScatterplotLayer, TextLayer } from '@deck.gl/layers';
import { HeatmapLayer } from '@deck.gl/aggregation-layers';
import Map from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { FlyToInterpolator } from '@deck.gl/core';

import { Button } from "@/components/ui/button";
import { SearchableCombobox } from '@/components/ui/searchable-combobox';
import { Loader2, RefreshCcw } from 'lucide-react';

import { useAnalyticsQuery } from '@/hooks/useAnalyticsQuery';
import { AnalyticsService } from '@/services/analytics.service';
import { CENTERS, OFFENCES } from '@/data/staticMappings';

// ── Constants (module-level, never recreated) ──────────────────────────────────
const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json';
const FLY_INTERPOLATOR = new FlyToInterpolator(); // single reusable instance

const INITIAL_VIEW_STATE = {
  longitude: 77.5946,
  latitude: 12.9716,
  zoom: 11,
  pitch: 0,
  bearing: 0,
  transitionDuration: 1000,
  transitionInterpolator: FLY_INTERPOLATOR
};

// Two anchor colors for the gradient – Cyan (low) to Deep Pink (high)
const COLOR_LOW = [0, 200, 255];
const COLOR_HIGH = [255, 20, 100];

// Pre-compute the heatmap color range once (6-step gradient from COLOR_LOW → COLOR_HIGH)
const HEATMAP_COLOR_RANGE = Array.from({ length: 6 }, (_, i) => {
  const t = i / 5;
  return [
    Math.round(COLOR_LOW[0] + (COLOR_HIGH[0] - COLOR_LOW[0]) * t),
    Math.round(COLOR_LOW[1] + (COLOR_HIGH[1] - COLOR_LOW[1]) * t),
    Math.round(COLOR_LOW[2] + (COLOR_HIGH[2] - COLOR_LOW[2]) * t),
  ];
});

// Pure function – sits outside the component, zero cost per render
function interpolateColor(ratio) {
  return [
    Math.round(COLOR_LOW[0] + (COLOR_HIGH[0] - COLOR_LOW[0]) * ratio),
    Math.round(COLOR_LOW[1] + (COLOR_HIGH[1] - COLOR_LOW[1]) * ratio),
    Math.round(COLOR_LOW[2] + (COLOR_HIGH[2] - COLOR_LOW[2]) * ratio),
    160 // partial transparency (alpha channel) so dense clusters remain readable
  ];
}

// ── Component ──────────────────────────────────────────────────────────────────
export default function GeospatialAnalysis() {
  // Filter state (triggers data fetches)
  const [centerCode, setCenterCode] = useState('all');
  const [offenceCode, setOffenceCode] = useState('all');
  const [vehicleType, setVehicleType] = useState('all');

  // View state stored in a ref so pan/zoom does NOT cause React re-renders.
  // DeckGL manages its own rendering loop via WebGL; React re-renders are wasteful here.
  const viewStateRef = useRef(INITIAL_VIEW_STATE);
  // We keep a separate React state only for transitions (fly-to on filter change).
  const [viewStateOverride, setViewStateOverride] = useState(INITIAL_VIEW_STATE);

  // ── Data fetching ──────────────────────────────────────────────────────────
  const { data: vehicleCategories } = useAnalyticsQuery(
    () => AnalyticsService.getVehicleClassification(),
    [],
    { useGlobalLoader: false }
  );

  const vehicleOptions = useMemo(() => {
    return vehicleCategories ? vehicleCategories.map(v => ({ code: v.name, name: v.name })) : [];
  }, [vehicleCategories]);

  const { data: mapResult, isLoading } = useAnalyticsQuery(
    () => AnalyticsService.getGeospatialMapData({ centerCode, offenceCode, vehicleType }),
    [centerCode, offenceCode, vehicleType],
    { useGlobalLoader: false }
  );

  // ── Handlers (stable references via useCallback) ───────────────────────────
  const handleReset = useCallback(() => {
    setCenterCode('all');
    setOffenceCode('all');
    setVehicleType('all');
    setViewStateOverride(INITIAL_VIEW_STATE);
  }, []);

  // This fires on every frame during pan/zoom – must NOT set React state.
  const handleViewStateChange = useCallback(({ viewState: newVS }) => {
    viewStateRef.current = newVS;
  }, []);

  // ── Fly-to on center selection ─────────────────────────────────────────────
  useEffect(() => {
    if (centerCode !== 'all' && mapResult?.data?.length > 0) {
      let sumLat = 0, sumLng = 0;
      const len = mapResult.data.length;
      for (let i = 0; i < len; i++) {
        sumLat += mapResult.data[i].latitude;
        sumLng += mapResult.data[i].longitude;
      }
      setViewStateOverride({
        longitude: sumLng / len,
        latitude: sumLat / len,
        zoom: 14,
        pitch: 45,
        bearing: 0,
        transitionDuration: 2000,
        transitionInterpolator: FLY_INTERPOLATOR
      });
    } else if (centerCode === 'all') {
      setViewStateOverride(INITIAL_VIEW_STATE);
    }
  }, [centerCode, mapResult]);

  // ── Pre-compute derived data (only when mapResult changes) ─────────────────
  const { processedData, maxTotal, sqrtMax, mapType } = useMemo(() => {
    if (!mapResult || !mapResult.data || mapResult.data.length === 0) {
      return { processedData: null, maxTotal: 0, sqrtMax: 0, mapType: null };
    }
    if (mapResult.type === 'city-wide') {
      let max = 0;
      const data = mapResult.data;
      for (let i = 0; i < data.length; i++) {
        if (data[i].total > max) max = data[i].total;
      }
      return {
        processedData: data,
        maxTotal: max || 1,
        sqrtMax: Math.sqrt(max || 1),
        mapType: 'city-wide'
      };
    }
    return {
      processedData: mapResult.data,
      maxTotal: 0,
      sqrtMax: 0,
      mapType: 'center-zoomed'
    };
  }, [mapResult]);

  // ── Build Deck.gl layers (only when processed data changes) ────────────────
  const layers = useMemo(() => {
    if (!processedData) return [];

    if (mapType === 'city-wide') {
      return [
        new ScatterplotLayer({
          id: 'city-wide-scatter',
          data: processedData,
          getPosition: d => [d.longitude, d.latitude],
          radiusUnits: 'pixels',
          radiusMinPixels: 5,
          radiusMaxPixels: 50,
          getRadius: d => {
            // Apply Math.sqrt() to the total violations count for the radius calculation
            const ratio = Math.sqrt(d.total) / sqrtMax;
            return 10 + ratio * 40; 
          },
          getFillColor: d => {
            const ratio = Math.sqrt(d.total) / sqrtMax;
            return interpolateColor(ratio);
          },
          pickable: true,
          autoHighlight: true,
          highlightColor: [255, 255, 255, 100],
          stroked: true,
          getLineColor: [255, 255, 255, 180],
          getLineWidth: 20,
          lineWidthUnits: 'meters',
          lineWidthMinPixels: 1,
          onClick: ({ object }) => {
            if (object) {
              setCenterCode(object.center_code.toString());
            }
          },
          updateTriggers: {
            getRadius: [sqrtMax],
            getFillColor: [sqrtMax]
          }
        }),
        new TextLayer({
          id: 'city-wide-text',
          data: processedData,
          pickable: false, // Prevents text from stealing hover events
          getPosition: d => [d.longitude, d.latitude],
          getText: d => d.total.toLocaleString(),
          getSize: 12,
          getColor: [255, 255, 255],
          getAlignmentBaseline: 'center',
          getTextAnchor: 'middle',
          fontFamily: 'Inter, sans-serif',
          fontWeight: 700
        })
      ];
    }

    // center-zoomed → heatmap
    return [
      new HeatmapLayer({
        id: 'center-zoomed-heatmap',
        data: processedData,
        getPosition: d => [d.longitude, d.latitude],
        radiusPixels: 45,
        intensity: 1,
        threshold: 0.05,
        colorRange: [
          [0, 255, 200],   // Bright Teal
          [0, 200, 255],   // Cyan
          [0, 100, 255],   // Bright Blue
          [100, 0, 255],   // Vivid Purple
          [200, 0, 255],   // Neon Magenta
          [255, 0, 100]    // Hot Pink
        ]
      })
    ];
  }, [processedData, mapType, sqrtMax]);

  const getTooltip = useCallback(({ object }) => {
    if (!object || object.center_code == null) return null;
    const center = CENTERS.find(c => String(c.code) === String(object.center_code));
    const name = center ? center.name : 'Unknown Station';
    return {
      html: `<div class="font-sans">
               <div class="font-bold text-sm mb-1">${object.center_code} - ${name}</div>
               <div class="text-xs text-muted-foreground">Violations: ${object.total.toLocaleString()}</div>
             </div>`,
      style: {
        backgroundColor: 'white',
        color: 'black',
        padding: '8px 12px',
        borderRadius: '6px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        border: '1px solid #e2e8f0',
        zIndex: 100
      }
    };
  }, []);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-[calc(100vh-theme(spacing.16))] w-full m-0 p-0 overflow-hidden animate-in fade-in duration-500">
      {/* Filter Bar */}
      <div className="flex-none bg-card border-b px-6 py-3 flex flex-wrap items-center justify-between gap-4 z-10 shadow-sm">
        <div className="flex flex-wrap items-center gap-4 flex-1">
          <div className="flex-1 min-w-[200px]">
            <SearchableCombobox 
              items={CENTERS}
              value={centerCode}
              onSelect={setCenterCode}
              placeholder="Search Center"
              emptyText="No center found."
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <SearchableCombobox 
              items={OFFENCES}
              value={offenceCode}
              onSelect={setOffenceCode}
              placeholder="Search Offence"
              emptyText="No offence found."
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <SearchableCombobox 
              items={vehicleOptions}
              value={vehicleType}
              onSelect={setVehicleType}
              placeholder="Search Vehicle Type"
              emptyText="No vehicle type found."
            />
          </div>
        </div>
        
        <Button variant="ghost" size="sm" onClick={handleReset} className="text-muted-foreground hover:text-foreground shrink-0">
          <RefreshCcw className="w-4 h-4 mr-2" />
          Reset
        </Button>
      </div>

      {/* Map Canvas */}
      <div className="flex-1 relative w-full h-full bg-background">
        {isLoading && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/50 backdrop-blur-sm">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        )}
        
        <DeckGL
          layers={layers}
          initialViewState={viewStateOverride}
          onViewStateChange={handleViewStateChange}
          controller={true}
          getTooltip={getTooltip}
          getCursor={({ isDragging, isHovering }) => isDragging ? 'grabbing' : isHovering ? 'pointer' : 'grab'}
        >
          <Map 
            mapStyle={MAP_STYLE} 
            reuseMaps
            preventStyleDiffing={true}
          />
        </DeckGL>
      </div>
    </div>
  );
}
