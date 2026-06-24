import React, { useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDataStore } from '../../store/useDataStore';
import { useTemporalStore } from '../../store/useTemporalStore';
import PageHeader from '../../components/temporal/PageHeader';
import KPIStrip from '../../components/temporal/KPIStrip';
import FilterSidebar from '../../components/temporal/FilterSidebar';
import TemporalMapColumn from '../../components/temporal/TemporalMapColumn';
import InsightsRow from '../../components/temporal/InsightsRow';
import DayHourHeatmap from '../../components/temporal/DayHourHeatmap';
import { Loader2 } from 'lucide-react';

export default function TemporalAnalysis() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { isEngineReady, error: dataError, syncMessage, initializeDataEngine } = useDataStore();
  
  const {
    filtersA, filtersB, compareMode, activeLayer, playbackState, viewState,
    dataA, dataB, weeklyHeatmapData, isLoadingA, isLoadingB,
    setFiltersA, setFiltersB, setCompareMode, setActiveLayer, setViewState,
    togglePlayback, resetPlayback, fetchDataA, fetchWeeklyHeatmap
  } = useTemporalStore();

  // Engine Init
  useEffect(() => {
    initializeDataEngine();
  }, [initializeDataEngine]);

  // Read URL Params on Mount
  useEffect(() => {
    const h = searchParams.get('h');
    const d = searchParams.get('d');
    const l = searchParams.get('l');
    
    let newFilters = { ...filtersA };
    let changed = false;

    if (h) {
      const parts = h.split('-');
      if (parts.length === 2) {
        newFilters.timeRange = [parseInt(parts[0], 10), parseInt(parts[1], 10)];
        changed = true;
      }
    }
    if (d) {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      if (d === 'all' || days[parseInt(d, 10)] !== undefined) {
        newFilters.dayOfWeek = d === 'all' ? 'all' : days[parseInt(d, 10)];
        changed = true;
      }
    }
    if (l) {
      const layerMap = { hexbins: 'Hexbins', heatmap: 'Heatmap', points: 'Points', impact: 'Impact' };
      if (layerMap[l.toLowerCase()]) {
        setActiveLayer(layerMap[l.toLowerCase()]);
      }
    }

    if (changed) {
      setFiltersA(newFilters);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update URL Params when filters change
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    
    if (filtersA.timeRange[0] === 0 && filtersA.timeRange[1] === 23) {
      params.delete('h');
    } else {
      params.set('h', `${filtersA.timeRange[0]}-${filtersA.timeRange[1]}`);
    }

    if (filtersA.dayOfWeek === 'all') {
      params.delete('d');
    } else {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      params.set('d', String(days.indexOf(filtersA.dayOfWeek)));
    }

    if (activeLayer === 'Hexbins') {
      params.delete('l');
    } else {
      params.set('l', activeLayer.toLowerCase());
    }

    setSearchParams(params, { replace: true });
  }, [filtersA, activeLayer, searchParams, setSearchParams]);

  // Initial Data Fetch
  useEffect(() => {
    if (isEngineReady) {
      fetchDataA();
      fetchWeeklyHeatmap();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEngineReady]);

  return (
    <div className="flex flex-col h-[calc(100vh-theme(spacing.16))] w-full overflow-y-auto custom-scrollbar animate-in fade-in duration-500 bg-background relative">
      <div className="w-full flex flex-col gap-4 p-6 pb-8">
        
        {/* Full-width Top Headers */}
        <PageHeader />
        <KPIStrip kpis={dataA?.kpis} />
        
        <div className="flex flex-col lg:flex-row gap-4 w-full h-[600px] xl:h-[700px] 2xl:h-[800px]">
          
          {/* Left Side: Map and Insights */}
          <div className="flex-1 flex flex-col gap-4 min-w-0 h-full">
            <div className="w-full flex-1 min-h-0 shrink-0">
              <TemporalMapColumn 
                compareMode={compareMode}
                activeLayer={activeLayer}
                setActiveLayer={setActiveLayer}
                viewState={viewState}
                onViewStateChange={setViewState}
                dataA={dataA}
                dataB={dataB}
                filtersA={filtersA}
                filtersB={filtersB}
                isPlaying={playbackState.isPlaying}
              />
            </div>
            
            {!compareMode && (
              <div className="w-full shrink-0">
                <InsightsRow dataA={dataA} filtersA={filtersA} />
              </div>
            )}
          </div>

          {/* Right Side: Filter Sidebar */}
          <div className="w-full lg:w-[320px] shrink-0 h-full border rounded-lg overflow-hidden bg-card shadow-sm">
            <FilterSidebar 
              filtersA={filtersA}
              setFiltersA={setFiltersA}
              filtersB={filtersB}
              setFiltersB={setFiltersB}
              compareMode={compareMode}
              setCompareMode={setCompareMode}
              playbackState={playbackState}
              togglePlayback={togglePlayback}
              resetPlayback={resetPlayback}
            />
          </div>
        </div>

        {/* Full-width Bottom: Heatmap */}
        <div className="w-full shrink-0">
          <DayHourHeatmap 
            data={weeklyHeatmapData}
            filters={filtersA}
            setFilters={setFiltersA}
          />
        </div>

      </div>

      {/* Loading Overlay */}
      {(!isEngineReady || (isLoadingA && !playbackState.isPlaying)) && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/50 backdrop-blur-sm transition-all pointer-events-none">
          <div className="flex flex-col items-center gap-2 bg-card p-6 rounded-lg shadow-lg border max-w-md text-center pointer-events-auto">
            {dataError ? (
              <>
                <div className="text-destructive font-bold mb-2">Engine Error</div>
                <div className="text-sm text-muted-foreground break-words">{dataError}</div>
              </>
            ) : (
              <>
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <span className="text-sm font-medium">
                  {!isEngineReady ? syncMessage : 'Processing Temporal Data...'}
                </span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
