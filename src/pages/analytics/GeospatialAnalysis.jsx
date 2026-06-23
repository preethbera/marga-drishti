import React, { useEffect, useCallback } from 'react';
import { useGeospatialStore } from '../../store/useGeospatialStore';
import { useDataStore } from '../../store/useDataStore';
import FilterBar from '../../components/geospatial/FilterBar';
import MapVisualization from '../../components/geospatial/MapVisualization';
import SidePanel from '../../components/geospatial/SidePanel';
import { GEOSPATIAL_CONFIG } from '../../core/config/geospatial';
import { Loader2 } from 'lucide-react';

export default function GeospatialAnalysis() {
  const { isEngineReady, error: dataError, syncMessage, initializeDataEngine } = useDataStore();
  const { 
    filters, 
    viewState, 
    data, 
    isLoading, 
    error: geoError,
    setFilters, 
    setViewState, 
    reset, 
    fetchMappings, 
    fetchData 
  } = useGeospatialStore();

  useEffect(() => {
    initializeDataEngine();
  }, [initializeDataEngine]);

  useEffect(() => {
    if (isEngineReady && data.mappings.centers.length === 0) {
      fetchMappings();
    }
  }, [isEngineReady, fetchMappings, data.mappings.centers.length]);

  useEffect(() => {
    if (isEngineReady) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEngineReady, filters]); // Re-fetch when filters change (store fetchData uses current filters)

  const handleFilterChange = useCallback((newFilter) => {
    setFilters(newFilter);
  }, [setFilters]);

  const handleCenterSelect = useCallback((center) => {
    if (center.code === 'all') {
      setFilters({ centerCode: 'all' });
      setViewState(GEOSPATIAL_CONFIG.INITIAL_VIEW_STATE);
    } else {
      setFilters({ centerCode: String(center.code) });
      // We will look up the lat/lon if needed, but the drill-down effect 
      // is handled. For now just set code and fly.
      // If we had coordinates handy, we could set them here.
      // Since duckdb fetches might delay, maybe we fetch the centroid in store?
      // Actually, if we have mappings we could add lat/lon to mappings.
      // For now, let the user pan, or we can use the mapAggregated data to fly before it unmounts.
      if (data.mapAggregated && data.mapAggregated.code) {
        const idx = data.mapAggregated.code.indexOf(center.code);
        if (idx !== -1) {
          setViewState({
            ...viewState,
            longitude: data.mapAggregated.longitude[idx],
            latitude: data.mapAggregated.latitude[idx],
            zoom: 14,
            pitch: 45,
            transitionDuration: 800,
            transitionInterpolator: GEOSPATIAL_CONFIG.TRANSITIONS.SMOOTH.transitionInterpolator
          });
        }
      }
    }
  }, [setFilters, setViewState, viewState, data.mapAggregated]);

  const handleClearCenter = useCallback(() => {
    setFilters({ centerCode: 'all' });
    setViewState(GEOSPATIAL_CONFIG.INITIAL_VIEW_STATE);
  }, [setFilters, setViewState]);

  const handleReset = useCallback(() => {
    reset();
  }, [reset]);

  const isDetailed = filters.centerCode !== 'all';

  return (
    <div className="flex flex-col h-[calc(100vh-theme(spacing.16))] w-full m-0 p-0 overflow-hidden animate-in fade-in duration-500 relative bg-background">
      <FilterBar 
        filters={filters}
        mappings={data.mappings}
        onFilterChange={handleFilterChange}
        onReset={handleReset}
      />

      <div className="flex-1 flex w-full min-h-0">
        {/* Left Side: Map (~75%) */}
        <div className="flex-[3] h-full relative">
          <MapVisualization 
            viewState={viewState}
            onViewStateChange={setViewState}
            isDetailed={isDetailed}
            onCenterSelect={handleCenterSelect}
          />
        </div>
        
        {/* Right Side: Panel (~25%) */}
        <div className="flex-[1] h-full bg-card shadow-sm border-l z-10 min-w-[320px] max-w-[450px]">
          <SidePanel 
            onCenterSelect={handleCenterSelect}
            onClearCenter={handleClearCenter}
          />
        </div>
      </div>

      {/* Loading Overlay */}
      {(!isEngineReady || isLoading || dataError || geoError) && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/50 backdrop-blur-sm transition-all">
          <div className="flex flex-col items-center gap-2 bg-card p-6 rounded-lg shadow-lg border max-w-md text-center">
            {dataError || geoError ? (
              <>
                <div className="text-destructive font-bold mb-2">Engine Error</div>
                <div className="text-sm text-muted-foreground break-words">
                  {dataError || geoError}
                </div>
              </>
            ) : (
              <>
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <span className="text-sm font-medium">
                  {!isEngineReady ? syncMessage : 'Processing Spatial Data...'}
                </span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

