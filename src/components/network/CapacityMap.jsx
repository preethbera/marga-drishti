import React, { useMemo, useState } from 'react';
import { useNetworkStore } from '@/store/useNetworkStore';
import { BaseMap } from '@/components/ui/base-map';
import { GeoJsonLayer } from '@deck.gl/layers';
import { GEOSPATIAL_CONFIG } from '@/core/config/map';
import { Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
  if (lossPercent >= 100) return [220, 38, 38, 255]; // Gridlock (Red-600)
  if (lossPercent >= 50) return [234, 88, 12, 255];  // Critical (Orange-600)
  if (lossPercent >= 20) return [202, 138, 4, 255];  // Marginal (Yellow-600)
  return [5, 150, 105, 255]; // Safe (Emerald-600)
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
            return [37, 99, 235, 255]; // Highlight selected (Blue-600)
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
    <div id="capacity-map-container" className="relative w-full h-full rounded-lg overflow-hidden border">
      <div className="absolute top-4 right-4 z-20 flex flex-col items-end gap-2 pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          <Button 
            variant="outline" 
            size="icon" 
            className="rounded-md shadow-sm bg-background dark:bg-background hover:bg-accent dark:hover:bg-accent h-9 w-9"
            onClick={() => {
              setViewState({
                longitude: 77.5946,
                latitude: 12.9716,
                zoom: 11.5,
                pitch: 0,
                bearing: 0,
                transitionDuration: 800,
                transitionInterpolator: GEOSPATIAL_CONFIG.TRANSITIONS.SMOOTH.transitionInterpolator
              });
            }}
            title="Fit to Data"
          >
            <Home className="w-4 h-4" />
          </Button>
        </div>
      </div>
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
            <div className="w-3 h-3 rounded-sm bg-emerald-600"></div>
            <span>Safe (0 - 20%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-yellow-600"></div>
            <span>Marginal (20 - 50%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-orange-600"></div>
            <span>Critical (50 - 100%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-red-600"></div>
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
