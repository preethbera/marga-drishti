import React, { useEffect } from 'react';
import { useExecutiveStore } from '../../store/useExecutiveStore';
import { useDataStore } from '../../store/useDataStore';
import { useGeospatialStore } from '../../store/useGeospatialStore';

import Header from '../../components/executive/Header';
import HeadlineBanner from '../../components/executive/HeadlineBanner';
import KPIStrip from '../../components/executive/KPIStrip';
import DailyVolumeTrend from '../../components/executive/DailyVolumeTrend';
import TopLists from '../../components/executive/TopLists';
import VehicleMix from '../../components/executive/VehicleMix';
import { Loader2 } from 'lucide-react';

export default function ExecutiveSummary() {
  const { isEngineReady, error: dataError, syncMessage, initializeDataEngine } = useDataStore();
  const { data: geoData, fetchMappings } = useGeospatialStore();
  
  const { 
    dateRange, 
    isLoading, 
    error: execError,
    stats,
    dailyTrend,
    topOffences,
    topStations,
    vehicleMix,
    setDateRange,
    setPredefinedRange,
    initializeDefaultRange
  } = useExecutiveStore();

  // Initialize Data Engine
  useEffect(() => {
    initializeDataEngine();
  }, [initializeDataEngine]);

  // Load mappings (used by TopLists for human-readable names)
  useEffect(() => {
    if (isEngineReady && geoData.mappings.centers.length === 0) {
      fetchMappings();
    }
  }, [isEngineReady, fetchMappings, geoData.mappings.centers.length]);

  // Initialize default date range and fetch initial data
  useEffect(() => {
    if (isEngineReady && !dateRange.from && !dateRange.to) {
      initializeDefaultRange();
    }
  }, [isEngineReady, dateRange, initializeDefaultRange]);

  const isDataLoading = (!isEngineReady || isLoading) && !stats;

  return (
    <div className="flex flex-col h-[calc(100vh-theme(spacing.16))] w-full m-0 p-6 overflow-y-auto animate-in fade-in duration-500 bg-background">
      <div className="max-w-[1400px] w-full mx-auto space-y-6 pb-12">
        <Header 
          dateRange={dateRange} 
          onDateRangeChange={setDateRange} 
          onPredefinedRange={setPredefinedRange} 
        />
        
        {/* If engine or queries have an error */}
        {(dataError || execError) && (
          <div className="bg-destructive/10 border border-destructive text-destructive p-4 rounded-lg">
            <h3 className="font-bold">Error loading summary</h3>
            <p className="text-sm mt-1">{dataError || execError}</p>
          </div>
        )}
        
        <KPIStrip 
          stats={stats} 
          dateRange={dateRange} 
          mappings={geoData.mappings}
          isLoading={isDataLoading} 
        />

        <HeadlineBanner 
          stats={stats} 
          dateRange={dateRange} 
          isLoading={isDataLoading} 
        />
        
        <DailyVolumeTrend 
          trendData={dailyTrend} 
          stats={stats}
          isLoading={isDataLoading} 
        />
        
        <TopLists 
          topOffences={topOffences} 
          topStations={topStations} 
          stats={stats}
          mappings={geoData.mappings}
          isLoading={isDataLoading} 
        />
        
        <VehicleMix 
          vehicleMix={vehicleMix} 
          stats={stats}
          isLoading={isDataLoading} 
        />
      </div>

      {/* Full-screen blocking loader only on initial mount before any data */}
      {!isEngineReady && !dataError && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm transition-all print:hidden">
          <div className="flex flex-col items-center gap-2 bg-card p-6 rounded-lg shadow-lg border max-w-md text-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="text-sm font-medium">{syncMessage || 'Initializing Data Engine...'}</span>
          </div>
        </div>
      )}
    </div>
  );
}
