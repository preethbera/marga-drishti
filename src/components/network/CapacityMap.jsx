import React, { useMemo, useState } from 'react';
import { useNetworkStore } from '@/store/useNetworkStore';
import { BaseMap } from '@/components/ui/base-map';
import { GeoJsonLayer } from '@deck.gl/layers';
import { GEOSPATIAL_CONFIG } from '@/core/config/geospatial';

const getLineWidth = (roadClass) => {
  switch (roadClass) {
    case 'arterial': return 6;
    case 'sub_arterial': return 5;
    case 'collector': return 4;
    default: return 3;
  }
};

const getDisplayClass = (rc) => {
  if (rc === 'arterial') return 'Arterial';
  if (rc === 'sub_arterial') return 'Sub-Arterial';
  if (rc === 'collector') return 'Collector';
  return 'Local';
};

const getColorFromLoss = (lossPercent) => {
  if (lossPercent >= 100) return [239, 68, 68, 255]; // Gridlock (Red)
  if (lossPercent >= 50) return [249, 115, 22, 255]; // Critical (Orange)
  if (lossPercent >= 20) return [234, 179, 8, 255];  // Marginal (Yellow)
  return [34, 197, 94, 255]; // Safe (Green)
};

export default function CapacityMap() {
  const { processedSegments, selectedSegmentId, setSelectedSegment } = useNetworkStore();
  const [hoverInfo, setHoverInfo] = useState(null);
  
  const [viewState, setViewState] = useState({
    longitude: 77.5946,
    latitude: 12.9716,
    zoom: 11.5,
    pitch: 0,
    bearing: 0
  });

  const geoJsonData = useMemo(() => {
    return {
      type: 'FeatureCollection',
      features: processedSegments
        .filter(s => s.geometry)
        .map(s => ({
          type: 'Feature',
          geometry: s.geometry,
          properties: s
        }))
    };
  }, [processedSegments]);

  const layers = useMemo(() => {
    return [
      new GeoJsonLayer({
        id: 'network-capacity-layer',
        data: geoJsonData,
        pickable: true,
        stroked: false,
        filled: false,
        extruded: false,
        lineWidthScale: 1,
        lineWidthMinPixels: 2,
        getLineColor: d => {
          if (selectedSegmentId && d.properties.id === selectedSegmentId) {
            return [56, 189, 248, 255]; // Highlight selected (Sky Blue)
          }
          return getColorFromLoss(d.properties.capacityLoss);
        },
        getLineWidth: d => {
          if (selectedSegmentId && d.properties.id === selectedSegmentId) return 8;
          return getLineWidth(d.properties.road_class);
        },
        onHover: info => setHoverInfo(info),
        onClick: info => {
          if (info.object) {
            setSelectedSegment(info.object.properties.id);
          }
        },
        updateTriggers: {
          getLineColor: [selectedSegmentId],
          getLineWidth: [selectedSegmentId]
        },
        transitions: {
          getLineColor: GEOSPATIAL_CONFIG.TRANSITIONS.SMOOTH.transitionDuration
        }
      })
    ];
  }, [geoJsonData, selectedSegmentId, setSelectedSegment]);

  return (
    <div className="relative w-full h-full rounded-lg overflow-hidden border">
      <BaseMap
        layers={layers}
        viewState={viewState}
        onViewStateChange={setViewState}
        onMouseLeave={() => setHoverInfo(null)}
      />

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-background/90 backdrop-blur border rounded p-3 shadow-md text-xs">
        <h4 className="font-semibold mb-2">Capacity Reduction</h4>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-green-500"></div>
            <span>Safe (0 - 20%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-yellow-500"></div>
            <span>Marginal (20 - 50%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-orange-500"></div>
            <span>Critical (50 - 100%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-red-500"></div>
            <span>Gridlock (100%)</span>
          </div>
        </div>
      </div>

      {/* Custom Tooltip Overlay */}
      {hoverInfo && hoverInfo.object && (
        <div 
          className="absolute z-50 pointer-events-none bg-card/95 backdrop-blur border rounded-lg shadow-xl p-3 text-sm min-w-[200px]"
          style={{ left: hoverInfo.x + 10, top: hoverInfo.y + 10 }}
        >
          <div className="font-bold border-b pb-1 mb-2 flex justify-between">
            <span>Segment {hoverInfo.object.properties.id}</span>
            <span className="text-xs font-normal text-muted-foreground bg-muted px-1.5 rounded">
              {getDisplayClass(hoverInfo.object.properties.road_class)}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            <span className="text-muted-foreground">Width:</span>
            <span className="text-right font-medium">{hoverInfo.object.properties.width}m</span>
            
            <span className="text-muted-foreground">Capacity Loss:</span>
            <span className="text-right font-medium">{hoverInfo.object.properties.capacityLoss.toFixed(1)}%</span>
            
            <span className="text-muted-foreground">PCU Blocked:</span>
            <span className="text-right font-medium">{hoverInfo.object.properties.concurrentPCU.toFixed(1)}</span>
            
            <span className="text-muted-foreground">Violations:</span>
            <span className="text-right font-medium">{hoverInfo.object.properties.violationCount}</span>
          </div>
        </div>
      )}
    </div>
  );
}
