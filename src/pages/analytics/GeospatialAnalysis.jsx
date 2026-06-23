import React, { useEffect, useCallback } from 'react';
import { useGeospatialStore } from '../../store/useGeospatialStore';
import { useDataStore } from '../../store/useDataStore';
import FilterBar from '../../components/geospatial/FilterBar';
import SidePanel from '../../components/geospatial/SidePanel';
import GeospatialHeader from '../../components/geospatial/GeospatialHeader';
import GeospatialInsightsRow from '../../components/geospatial/GeospatialInsightsRow';
import AnalyticsMap from '../../components/ui/analytics-map';
import { GEOSPATIAL_CONFIG, getDynamicViewState } from '../../core/config/map';
import { Loader2, Layers, MapPin, Activity, Home, ArrowLeft } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';

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

  const [activeLayerMode, setActiveLayerMode] = React.useState('Bubbles'); // 'Hexbins', 'Bubbles', 'Heatmap'

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
    <div className="flex flex-col h-[calc(100vh-theme(spacing.16))] w-full overflow-y-auto custom-scrollbar animate-in fade-in duration-500 bg-background relative">
      <div className="w-full flex flex-col gap-4 p-6 pb-8">
        
        {/* Full-width Top Headers */}
        <GeospatialHeader />
        
        <div className="w-full shrink-0 rounded-lg overflow-hidden border bg-card shadow-sm">
          <FilterBar 
            filters={filters}
            mappings={data.mappings}
            onFilterChange={handleFilterChange}
            onReset={handleReset}
          />
        </div>

        <div className="w-full shrink-0">
          <GeospatialInsightsRow 
            filters={filters} 
            mappings={data.mappings} 
          />
        </div>

        <div className="flex flex-col lg:flex-row gap-4 w-full h-[600px] xl:h-[700px] 2xl:h-[800px]">
          {/* Left Side: Map */}
          <div id="geospatial-map-container" className="flex-1 flex w-full min-h-0 border rounded-lg overflow-hidden relative">
            <AnalyticsMap 
              viewState={viewState}
              onViewStateChange={setViewState}
              layerConfigs={[
                {
                  id: isDetailed ? `drill-${activeLayerMode}` : `city-${activeLayerMode}`,
                  type: isDetailed && activeLayerMode === 'Bubbles' ? 'Points' : activeLayerMode,
                  data: isDetailed ? data.mapDetailed : (activeLayerMode === 'Bubbles' ? data.mapAggregated : data.mapDetailed),
                  overrides: {
                    onClick: activeLayerMode === 'Bubbles' ? ({ index }) => {
                      if (index !== -1 && data.mapAggregated && data.mapAggregated.code) {
                        handleCenterSelect({ code: data.mapAggregated.code[index], name: data.mapAggregated.name[index] });
                      }
                    } : undefined
                  },
                  extras: {
                    maxCount: activeLayerMode === 'Bubbles' && data.mapAggregated && data.mapAggregated.count
                      ? Array.from(data.mapAggregated.count).reduce((max, c) => Math.max(max, Number(c)), 1)
                      : 1,
                    top10Data: !isDetailed && activeLayerMode === 'Hexbins' ? data.top10 : null
                  }
                }
              ]}
            >
              <div className="absolute top-4 right-4 z-20 flex flex-col items-end gap-2 pointer-events-none">
                <div className="flex items-center gap-2 pointer-events-auto">
                  <Select value={activeLayerMode} onValueChange={setActiveLayerMode}>
                    <SelectTrigger className="w-32 !h-9 bg-background hover:bg-background dark:bg-background dark:hover:bg-background border rounded-md shadow-sm font-semibold focus:ring-0 focus:ring-offset-0">
                      <div className="flex items-center">
                        <Layers className="w-4 h-4 text-muted-foreground mr-2 shrink-0" />
                        <SelectValue placeholder="Layer" />
                      </div>
                    </SelectTrigger>
                    <SelectContent position="popper" side="bottom" sideOffset={4} alignItemWithTrigger={false} className="bg-background dark:bg-background">
                      <SelectItem value="Hexbins">3D Hex</SelectItem>
                      <SelectItem value="Bubbles">{isDetailed ? 'Points' : 'Bubbles'}</SelectItem>
                      <SelectItem value="Heatmap">Heatmap</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="rounded-md shadow-sm bg-background dark:bg-background hover:bg-accent dark:hover:bg-accent h-9 w-9"
                    onClick={() => {
                      const currentData = isDetailed ? data.mapDetailed : (activeLayerMode === 'Bubbles' ? data.mapAggregated : data.mapDetailed);
                      const mapContainer = document.getElementById('geospatial-map-container');
                      const w = mapContainer ? mapContainer.clientWidth : 800;
                      const h = mapContainer ? mapContainer.clientHeight : 600;
                      setViewState(getDynamicViewState(currentData, w, h));
                    }}
                    title="Fit to Data"
                  >
                    <Home className="w-4 h-4" />
                  </Button>
                </div>

                {isDetailed && (
                  <Button 
                    variant="outline"
                    onClick={handleClearCenter}
                    className="pointer-events-auto h-9 w-full rounded-md shadow-sm bg-background dark:bg-background hover:bg-accent dark:hover:bg-accent text-xs font-semibold flex items-center justify-center gap-1.5"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Back to city view
                  </Button>
                )}
              </div>

              {/* Drill-down overlay */}
              {isDetailed && (
                <div className="absolute top-4 left-4 z-20 flex flex-col gap-2 pointer-events-none">
                  <div className="bg-card/90 backdrop-blur-md border rounded-md p-3 shadow-sm flex flex-col max-w-[250px]">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Drill-Down</span>
                    <span className="font-bold text-base leading-tight truncate">
                      {data.mappings.centers.find(c => String(c.code) === String(filters.centerCode))?.name || 'Centre'}
                    </span>
                  </div>
                </div>
              )}
            </AnalyticsMap>
          </div>
          
          {/* Right Side: Panel */}
          <div className="w-full lg:w-[320px] xl:w-[450px] shrink-0 h-full bg-card shadow-sm border rounded-lg z-10 overflow-hidden">
            <SidePanel 
              onCenterSelect={handleCenterSelect}
              onClearCenter={handleClearCenter}
            />
          </div>
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

