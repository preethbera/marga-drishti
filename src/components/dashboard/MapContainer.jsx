import React, { useState, useCallback } from 'react';
import DeckGL from '@deck.gl/react';
import { HexagonLayer } from '@deck.gl/aggregation-layers';
import Map from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useUiStore } from '@/store/useUiStore';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';

export default function MapContainer({ mapData }) {
  const { viewport, setViewport, isLoading } = useUiStore();
  const [hoverInfo, setHoverInfo] = useState(null);

  const onViewStateChange = useCallback(({ viewState }) => {
    setViewport(viewState);
  }, [setViewport]);

  const transformRequest = useCallback((url, resourceType) => {
    return { url };
  }, []);

  const layers = [];

  if (mapData && mapData.length > 0) {
    layers.push(
      new HexagonLayer({
        id: 'hexagon-layer',
        data: mapData,
        getPosition: d => [d.longitude, d.latitude],
        radius: 100, 
        elevationScale: 4,
        extruded: true,
        pickable: true,
        opacity: 0.6,
        colorRange: [
          [237, 248, 251],
          [191, 211, 230],
          [158, 188, 218],
          [140, 150, 198],
          [136, 86, 167],
          [129, 15, 124]
        ],
        onHover: info => setHoverInfo(info)
      })
    );
  }

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden border border-border">
      {isLoading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/50 backdrop-blur-sm">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      )}
      
      <DeckGL
        layers={layers}
        viewState={viewport}
        onViewStateChange={onViewStateChange}
        controller={true}
        getCursor={({ isDragging }) => isDragging ? 'grabbing' : 'grab'}
      >
        <Map 
          mapStyle={MAP_STYLE} 
          transformRequest={transformRequest}
        />
      </DeckGL>

      {hoverInfo && hoverInfo.object && (
        <div
          className="absolute z-40 pointer-events-none"
          style={{
            left: hoverInfo.x,
            top: hoverInfo.y,
          }}
        >
          <Card className="shadow-lg border-muted bg-background/95 backdrop-blur">
            <CardContent className="p-3 text-sm flex flex-col gap-1">
              <div className="font-semibold text-primary">Traffic Violations</div>
              <div>Count: <span className="font-mono font-bold text-destructive">
                {hoverInfo.object.pointCount ?? (hoverInfo.object.pointIndices ? hoverInfo.object.pointIndices.length : 0)}
              </span></div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
