import React, { useCallback } from 'react';
import DeckGL from '@deck.gl/react';
import Map from 'react-map-gl/maplibre';
import { GEOSPATIAL_CONFIG } from '../../core/config/map';
import { useSettingsStore } from '../../store/useSettingsStore';

export function BaseMap({
  layers = [],
  viewState,
  onViewStateChange,
  children,
  onMouseLeave,
  mapStyle,
  initialViewState = GEOSPATIAL_CONFIG.INITIAL_VIEW_STATE,
  ...deckProps
}) {
  const settingsMapStyleKey = useSettingsStore(state => state.mapStyle);
  const resolvedMapStyle = mapStyle || GEOSPATIAL_CONFIG.MAP_STYLES[settingsMapStyleKey] || GEOSPATIAL_CONFIG.MAP_STYLE;
  const handleViewStateChange = useCallback(({ viewState: newVS }) => {
    if (onViewStateChange) {
      onViewStateChange(newVS);
    }
  }, [onViewStateChange]);

  const stateProps = viewState !== undefined
    ? { viewState, onViewStateChange: handleViewStateChange }
    : { initialViewState };

  return (
    <div className="flex-1 relative w-full h-full bg-background" onMouseLeave={onMouseLeave}>
      <DeckGL
        layers={layers}
        {...stateProps}
        controller={true}
        getCursor={({ isDragging, isHovering }) => isDragging ? 'grabbing' : isHovering ? 'pointer' : 'grab'}
        {...deckProps}
      >
        <Map 
          mapStyle={resolvedMapStyle} 
          reuseMaps
          preventStyleDiffing={true}
        />
        {children}
      </DeckGL>
    </div>
  );
}
