import React, { useCallback } from 'react';
import DeckGL from '@deck.gl/react';
import Map from 'react-map-gl/maplibre';
import { GEOSPATIAL_CONFIG } from '../../core/config/map';

export function BaseMap({
  layers = [],
  viewState,
  onViewStateChange,
  children,
  onMouseLeave,
  mapStyle = GEOSPATIAL_CONFIG.MAP_STYLE,
  ...deckProps
}) {
  const handleViewStateChange = useCallback(({ viewState: newVS }) => {
    if (onViewStateChange) {
      onViewStateChange(newVS);
    }
  }, [onViewStateChange]);

  return (
    <div className="flex-1 relative w-full h-full bg-background" onMouseLeave={onMouseLeave}>
      <DeckGL
        layers={layers}
        initialViewState={viewState}
        viewState={viewState}
        onViewStateChange={handleViewStateChange}
        controller={true}
        getCursor={({ isDragging, isHovering }) => isDragging ? 'grabbing' : isHovering ? 'pointer' : 'grab'}
        {...deckProps}
      >
        <Map 
          mapStyle={mapStyle} 
          reuseMaps
          preventStyleDiffing={true}
        />
        {children}
      </DeckGL>
    </div>
  );
}
