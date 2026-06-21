import React, { useEffect } from 'react';
import DataUploadZone from "@features/dataManagement/components/DataUploadZone";
import DataRegistryTable from "@features/dataManagement/components/DataRegistryTable";
import DataStatusCard from "@features/dataManagement/components/DataStatusCard";
import DataLogsCard from '@features/dataManagement/components/DataLogsCard';
import { useUiStore } from '@core/store/useUiStore';
import { listOPFSFiles } from '@lib/opfs';


export default function DataManagement() {
  const { activeDatasetId, setActiveDatasetId, setIsDataLoaded, addLog, availableDatasets } = useUiStore();

  return (
    <div className="max-w-6xl mx-auto w-full px-6 md:px-8 flex flex-col gap-8 h-full overflow-y-auto">
      
      {/* Section 1: Hero & Upload Deck */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Data Management</h1>
          <p className="text-muted-foreground max-w-2xl">
            Upload custom local datasets into the secure browser Origin Private File System (OPFS) and manage active unified records.
          </p>
        </div>
        
        <div className="w-full">
          <DataUploadZone />
        </div>
      </div>

      {/* Section 2: Main Registry Core */}
      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold tracking-tight">Unified Data Registry</h2>
        <DataRegistryTable />
      </div>

      {/* Section 3: Diagnostic Metrics */}
      <div className="grid md:grid-cols-2 gap-6 mt-4">
        <DataStatusCard />
        <div className="h-64">
          <DataLogsCard />
        </div>
      </div>

    </div>
  );
}
