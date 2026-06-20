import React from 'react';
import { Outlet } from 'react-router-dom';
import { useUiStore } from '@/store/useUiStore';
import { Loader2 } from 'lucide-react';

export default function AnalyticsGuard() {
  const isDataLoaded = useUiStore(state => state.isDataLoaded);

  // Data not ready yet — show loading screen. 
  // initializeAppData() is already running in the background and will
  // set isDataLoaded=true once DuckDB is initialized and the table is mounted.
  if (!isDataLoaded) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full min-h-[50vh] space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">Initializing Data Engine...</p>
      </div>
    );
  }

  return <Outlet />;
}
