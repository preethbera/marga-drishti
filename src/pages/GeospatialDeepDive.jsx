import React, { useState, useEffect, useMemo, useCallback } from 'react';
import DeckGL from '@deck.gl/react';
import { ScatterplotLayer, TextLayer } from '@deck.gl/layers';
import { HeatmapLayer } from '@deck.gl/aggregation-layers';
import Map from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { FlyToInterpolator } from '@deck.gl/core';

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchableCombobox } from '@/components/ui/searchable-combobox';
import { Loader2, RefreshCcw } from 'lucide-react';

import { useAnalyticsQuery } from '@/hooks/useAnalyticsQuery';
import { AnalyticsService } from '@/services/analytics.service';
import { CENTERS, OFFENCES, VEHICLE_TYPES } from '@/data/staticMappings';

const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';
const INITIAL_VIEW_STATE = {
  longitude: 77.5946,
  latitude: 12.9716,
  zoom: 11,
  pitch: 0,
  bearing: 0,
  transitionDuration: 1000,
  transitionInterpolator: new FlyToInterpolator()
};

export default function GeospatialDeepDive() {
  const [centerCode, setCenterCode] = useState('all');
  const [offenceCode, setOffenceCode] = useState('all');
  const [vehicleType, setVehicleType] = useState('all');
  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);

  const { data: mapResult, isLoading } = useAnalyticsQuery(
    () => AnalyticsService.getGeospatialMapData({ centerCode, offenceCode, vehicleType }),
    [centerCode, offenceCode, vehicleType],
    { useGlobalLoader: false }
  );

  const handleReset = () => {
    setCenterCode('all');
    setOffenceCode('all');
    setVehicleType('all');
    setViewState(INITIAL_VIEW_STATE);
  };

  // Update view state when a center is selected to fly there
  useEffect(() => {
    if (centerCode !== 'all' && mapResult?.type === 'center-zoomed' && mapResult.data.length > 0) {
      // Calculate average lat/lng for the selected center's points
      const sumLat = mapResult.data.reduce((sum, p) => sum + p.latitude, 0);
      const sumLng = mapResult.data.reduce((sum, p) => sum + p.longitude, 0);
      const avgLat = sumLat / mapResult.data.length;
      const avgLng = sumLng / mapResult.data.length;
      
      setViewState(prev => ({
        ...prev,
        longitude: avgLng,
        latitude: avgLat,
        zoom: 14,
        pitch: 45,
        transitionDuration: 2000,
        transitionInterpolator: new FlyToInterpolator()
      }));
    } else if (centerCode === 'all') {
      setViewState(INITIAL_VIEW_STATE);
    }
  }, [centerCode, mapResult]);

  const layers = useMemo(() => {
    if (!mapResult || !mapResult.data) return [];

    if (mapResult.type === 'city-wide') {
      // State A: Bubble map with counts
      const maxTotal = Math.max(...mapResult.data.map(d => d.total), 1);
      
      return [
        new ScatterplotLayer({
          id: 'center-scatter',
          data: mapResult.data,
          getPosition: d => [d.longitude, d.latitude],
          getFillColor: [255, 65, 84, 200],
          getRadius: d => Math.sqrt(d.total / maxTotal) * 1000,
          radiusMinPixels: 10,
          radiusMaxPixels: 50,
          pickable: true,
          transitions: {
            getRadius: 500
          }
        }),
        new TextLayer({
          id: 'center-text',
          data: mapResult.data,
          getPosition: d => [d.longitude, d.latitude],
          getText: d => d.total.toLocaleString(),
          getSize: 14,
          getColor: [255, 255, 255],
          getAlignmentBaseline: 'center',
          getTextAnchor: 'middle',
          fontFamily: 'Inter, sans-serif',
          fontWeight: 700
        })
      ];
    } else {
      // State B: Heatmap of raw points
      return [
        new HeatmapLayer({
          id: 'center-heatmap',
          data: mapResult.data,
          getPosition: d => [d.longitude, d.latitude],
          radiusPixels: 40,
          intensity: 1,
          threshold: 0.1,
          colorRange: [
            [25, 25, 112],
            [0, 191, 255],
            [124, 252, 0],
            [255, 215, 0],
            [255, 69, 0],
            [255, 0, 0]
          ],
        })
      ];
    }
  }, [mapResult]);

  return (
    <div className="flex flex-col h-[calc(100vh-theme(spacing.16))] w-full m-0 p-0 overflow-hidden animate-in fade-in duration-500">
      {/* Top Filter Bar */}
      <div className="flex-none bg-card border-b px-6 py-3 flex items-center justify-between z-10 shadow-sm">
        <div className="flex items-center gap-4 flex-1">
          <div className="w-[300px]">
            <SearchableCombobox 
              items={CENTERS}
              value={centerCode}
              onSelect={setCenterCode}
              placeholder="Search Center (Code or Name)"
              emptyText="No center found."
            />
          </div>
          <div className="w-[300px]">
            <SearchableCombobox 
              items={OFFENCES}
              value={offenceCode}
              onSelect={setOffenceCode}
              placeholder="Search Offence (Code or Name)"
              emptyText="No offence found."
            />
          </div>
          <div className="w-[200px]">
            <Select value={vehicleType} onValueChange={setVehicleType}>
              <SelectTrigger>
                <SelectValue placeholder="Vehicle Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Vehicles</SelectItem>
                {VEHICLE_TYPES.map(vt => (
                  <SelectItem key={vt.code} value={vt.code}>{vt.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <Button variant="ghost" size="sm" onClick={handleReset} className="text-muted-foreground hover:text-foreground">
          <RefreshCcw className="w-4 h-4 mr-2" />
          Reset Filters
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
          viewState={viewState}
          onViewStateChange={({ viewState: newViewState }) => setViewState(newViewState)}
          controller={true}
          getCursor={({ isDragging }) => isDragging ? 'grabbing' : 'grab'}
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
