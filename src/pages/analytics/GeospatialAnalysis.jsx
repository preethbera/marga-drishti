import React, { useEffect, useCallback } from 'react';
import { useGeospatialStore } from '../../store/useGeospatialStore';
import { useDataStore } from '../../store/useDataStore';
import FilterBar from '../../components/geospatial/FilterBar';
import MapVisualization from '../../components/geospatial/MapVisualization';
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

  // 🔴 THIS WAS MISSING! We need to actually start the engine!
  useEffect(() => {
    initializeDataEngine();
  }, [initializeDataEngine]);

  // Load mappings on mount if engine is ready
  useEffect(() => {
    if (isEngineReady && data.mappings.centers.length === 0) {
      fetchMappings();
    }
  }, [isEngineReady, fetchMappings, data.mappings.centers.length]);

  // Initial data load
  useEffect(() => {
    if (isEngineReady) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEngineReady]); // Only on engine ready

  const handleFilterChange = useCallback((newFilter) => {
    setFilters(newFilter);
  }, [setFilters]);

  const handleCenterSelect = useCallback((center) => {
    setFilters({ centerCode: String(center.code) });
    setViewState({
      ...viewState,
      longitude: center.longitude,
      latitude: center.latitude,
      zoom: 14,
      transitionDuration: GEOSPATIAL_CONFIG.TRANSITIONS.SMOOTH.transitionDuration,
      transitionInterpolator: GEOSPATIAL_CONFIG.TRANSITIONS.SMOOTH.transitionInterpolator
    });
  }, [setFilters, setViewState, viewState]);

  const handleReset = useCallback(() => {
    reset();
  }, [reset]);

  const isDetailed = filters.centerCode !== 'all';

  return (
    <div className="flex flex-col h-[calc(100vh-theme(spacing.16))] w-full m-0 p-0 overflow-hidden animate-in fade-in duration-500 relative">
      <FilterBar 
        filters={filters}
        mappings={data.mappings}
        onFilterChange={handleFilterChange}
        onReset={handleReset}
      />

      <MapVisualization 
        viewState={viewState}
        onViewStateChange={setViewState}
        data={data}
        isDetailed={isDetailed}
        onCenterSelect={handleCenterSelect}
      />

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
                <div className="text-xs text-muted-foreground mt-4">
                  Check browser console (F12) for more details. You may need to clear your site data if OPFS is corrupted due to disk space issues.
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

