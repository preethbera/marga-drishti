import React, { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Info, Loader2 } from 'lucide-react';
import DeckGL from '@deck.gl/react';
import { GeoJsonLayer } from '@deck.gl/layers';
import { Map } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useNetworkStore } from '../useNetworkStore';
import { useNetworkAggregate, useCongestionCascade, useAdjacencyList } from '../useNetworkHooks';
import { NETWORK_CONFIG, interpolateColor } from '../networkConfig';

const MAP_STYLE = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

export function CapacityMap() {
  const { status, data } = useNetworkAggregate();
  const adjacencyMap = useAdjacencyList();
  
  const { 
    selectedSegmentId, 
    selectSegment, 
    cascadeOriginSegmentId,
    cascadeMaxHops,
    cascadeDecayFactor
  } = useNetworkStore();

  const cascadeSegments = useCongestionCascade(
    adjacencyMap, 
    data, 
    cascadeOriginSegmentId, 
    cascadeMaxHops, 
    cascadeDecayFactor
  );

  const cascadeSet = useMemo(() => new Set(cascadeSegments.map(c => c.segmentId)), [cascadeSegments]);

  const layers = useMemo(() => {
    if (!data || data.length === 0) return [];

    const geoJsonData = {
      type: 'FeatureCollection',
      features: data
        .filter(seg => seg.capacityReduction > 0 || seg.segment_id === cascadeOriginSegmentId)
        .map(seg => ({
          type: 'Feature',
          geometry: typeof seg.geometry === 'string' ? JSON.parse(seg.geometry) : seg.geometry,
        properties: {
          ...seg
        }
      }))
    };

    return [
      new GeoJsonLayer({
        id: 'capacity-layer',
        data: geoJsonData,
        pickable: true,
        stroked: false,
        filled: false,
        lineWidthScale: 1,
        lineWidthMinPixels: 4,
        getLineColor: d => interpolateColor(d.properties.capacityReduction),
        getLineWidth: d => d.properties.road_class === 'Arterial' ? 6 : (d.properties.road_class === 'Sub-Arterial' ? 5 : 4),
        onClick: (info) => {
          if (info.object) {
            selectSegment(info.object.properties.segment_id);
          }
        },
        updateTriggers: {
          getLineColor: [data] // depends only on capacityReduction which is inside data
        }
      }),
      
      // Secondary layer for Cascade Overlay
      cascadeOriginSegmentId ? new GeoJsonLayer({
        id: 'cascade-overlay-layer',
        data: geoJsonData.features.filter(f => cascadeSet.has(f.properties.segment_id) || f.properties.segment_id === cascadeOriginSegmentId),
        pickable: false,
        stroked: false,
        filled: false,
        lineWidthScale: 1,
        lineWidthMinPixels: 4,
        getLineColor: d => {
          if (d.properties.segment_id === cascadeOriginSegmentId) {
            return NETWORK_CONFIG.cascade.originColor;
          }
          // Find hop distance
          const cascadeInfo = cascadeSegments.find(c => c.segmentId === d.properties.segment_id);
          const opacity = cascadeInfo 
            ? Math.max(NETWORK_CONFIG.cascade.minOpacity, NETWORK_CONFIG.cascade.maxOpacity - (cascadeInfo.hopDistance * 40))
            : 255;
          return [...NETWORK_CONFIG.cascade.footprintColor.slice(0,3), opacity];
        },
        getLineWidth: d => d.properties.segment_id === cascadeOriginSegmentId ? 8 : 6,
        updateTriggers: {
          getLineColor: [cascadeOriginSegmentId, cascadeSegments]
        }
      }) : null
    ].filter(Boolean);
  }, [data, cascadeOriginSegmentId, cascadeSegments, cascadeSet, selectSegment]);

  const getTooltip = ({ object }) => {
    if (!object) return null;
    const p = object.properties;
    return `Segment ID: ${p.segment_id}
Road Class: ${p.road_class}
Width: ${p.W_total.toFixed(1)}m
Capacity Reduction: ${p.capacityReduction.toFixed(1)}%
PCU Blocked: ${p.PCU_parked.toFixed(1)}
Violations: ${p.violationCount}`;
  };

  if (status === 'error' || (status === 'empty' && data.length === 0)) {
    return (
      <Card className="h-[500px] flex items-center justify-center">
        <Alert className="max-w-md">
          <Info className="h-4 w-4" />
          <AlertTitle>No Road Network Data</AlertTitle>
          <AlertDescription>Map requires segment data to render.</AlertDescription>
        </Alert>
      </Card>
    );
  }

  return (
    <Card className="h-[600px] flex flex-col relative overflow-hidden">
      {status === 'loading' && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/50 backdrop-blur-sm">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      )}
      <DeckGL
        layers={layers}
        initialViewState={NETWORK_CONFIG.viewport}
        controller={true}
        getTooltip={getTooltip}
        getCursor={({ isDragging, isHovering }) => isDragging ? 'grabbing' : isHovering ? 'pointer' : 'grab'}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
      >
        <Map 
          mapStyle={MAP_STYLE} 
          reuseMaps
          preventStyleDiffing={true}
        />
      </DeckGL>

      {/* Legend Overlay */}
      <Card className="absolute bottom-4 left-4 w-64 p-3 bg-background/90 backdrop-blur-sm shadow-md border-border">
        <h4 className="text-xs font-semibold mb-2">Capacity Reduction</h4>
        <div className="flex h-2 w-full rounded overflow-hidden">
          <div className="flex-1" style={{ backgroundColor: `rgb(${NETWORK_CONFIG.choropleth.safe.join(',')})` }} />
          <div className="flex-1" style={{ backgroundColor: `rgb(${NETWORK_CONFIG.choropleth.marginal.join(',')})` }} />
          <div className="flex-1" style={{ backgroundColor: `rgb(${NETWORK_CONFIG.choropleth.critical.join(',')})` }} />
          <div className="flex-1" style={{ backgroundColor: `rgb(${NETWORK_CONFIG.choropleth.gridlocked.join(',')})` }} />
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
          <span>0%</span>
          <span>Gridlock</span>
        </div>
      </Card>
    </Card>
  );
}
