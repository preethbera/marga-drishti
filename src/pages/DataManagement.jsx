import React, { useEffect } from 'react';
import DataUploadZone from '@/components/data/DataUploadZone';
import DataRegistryTable from '@/components/data/DataRegistryTable';
import DataStatusCard from '@/components/data/DataStatusCard';
import DataLogsCard from '@/components/data/DataLogsCard';
import { useUiStore } from '@/store/useUiStore';
import { listOPFSFiles } from '@/lib/opfs';
import { fetchSystemDefault, setActiveTable } from '@/lib/duckdbEngine';

export default function DataManagement() {
  const { setAvailableDatasets, activeDatasetId, setActiveDatasetId, setIsDataLoaded, addLog, availableDatasets } = useUiStore();

  useEffect(() => {
    let active = true;
    const initializeData = async () => {
      try {
        const opfsFiles = await listOPFSFiles();
        let validDatasets = [...opfsFiles];
        
        // Dynamically verify all system default files using the generated index.json
        const defaultFiles = [];
        
        try {
          const indexRes = await fetch('/data/index.json');
          if (indexRes.ok) {
            const potentialDefaults = await indexRes.json();
            
            for (const filename of potentialDefaults) {
              const url = `/data/${filename}`;
              try {
                const res = await fetch(url, { method: 'HEAD' });
                const contentType = res.headers.get('content-type');
                
                if (res.ok && (!contentType || !contentType.includes('text/html'))) {
                  const sizeHeader = res.headers.get('content-length');
                  defaultFiles.push({
                    id: `System Default|${filename}`,
                    name: filename,
                    source: 'System Default',
                    url: url,
                    size: sizeHeader ? parseInt(sizeHeader, 10) : 0
                  });
                }
              } catch (e) {
                console.warn(`Failed to fetch metadata for ${filename}`);
              }
            }
          }
        } catch (e) {
          console.warn("Could not load /data/index.json");
        }
        
        validDatasets = [...defaultFiles, ...validDatasets];
        if (active) setAvailableDatasets(validDatasets);

        // Auto-mount system default if nothing is active
        if (!activeDatasetId && active && validDatasets.length > 0) {
          const firstFile = validDatasets[0];
          addLog(`Mounting ${firstFile.name}...`);
          
          let buffer;
          if (firstFile.source === 'System Default') {
            buffer = await fetchSystemDefault(firstFile.url);
          } else {
            const opfsFile = await getFileFromOPFS(firstFile.name);
            buffer = new Uint8Array(await opfsFile.arrayBuffer());
          }
          
          const rowCount = await setActiveTable(firstFile.id, buffer);
          if (active) {
            setActiveDatasetId(firstFile.id);
            setIsDataLoaded(true, rowCount);
            addLog(`Mounted successfully (${rowCount.toLocaleString()} rows).`);
          }
        }
      } catch (e) {
        if (active) addLog(`Initialization Error: ${e.message}`);
      }
    };
    
    // Only run if we don't already have datasets loaded
    if (availableDatasets.length === 0) {
       initializeData();
    }
    
    return () => { active = false; };
  }, [availableDatasets.length, activeDatasetId, addLog, setActiveDatasetId, setAvailableDatasets, setIsDataLoaded]);

  return (
    <div className="max-w-6xl mx-auto w-full p-6 md:p-8 flex flex-col gap-8 h-full overflow-y-auto">
      
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
