import React, { useCallback, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { UploadCloud, Loader2 } from 'lucide-react';
import { useUiStore } from '@/store/useUiStore';
import { saveToOPFS, listOPFSFiles } from '@/lib/opfs';
import { DatabaseService } from '@/services/database.service';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function DataUploadZone() {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null); // null, 'writing', 'mounting'
  const [datasetType, setDatasetType] = useState('violations');
  const { addLog, availableDatasets, setAvailableDatasets, setIsDataLoaded } = useUiStore();

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const processFile = async (file) => {
    if (!file || !file.name.endsWith('.parquet')) {
      alert("Please upload a valid .parquet file.");
      addLog("Failed to upload: Invalid file type.");
      return;
    }

    try {
      addLog(`Writing ${file.name} to OPFS as ${datasetType}...`);
      setUploadStatus('writing');
      
      const uniqueName = await saveToOPFS(file, datasetType);
      const fileId = `OPFS|${uniqueName}`;
      addLog(`Successfully saved ${uniqueName} to OPFS.`);

      // Update the available datasets
      const opfsFiles = await listOPFSFiles();
      const sysDefaults = availableDatasets.filter(p => p.source === 'System Default');
      setAvailableDatasets([...sysDefaults, ...opfsFiles]);

      // Automatically mount it
      setUploadStatus('mounting');
      addLog(`Mounting ${uniqueName} into WASM Engine...`);
      const buffer = new Uint8Array(await file.arrayBuffer());
      const { tableName, rowCount } = await DatabaseService.mountDataset(uniqueName, buffer);
      
      const store = useUiStore.getState();
      const currentMounted = store.mountedDatasets || [];
      if (!currentMounted.includes(tableName)) {
        store.setMountedDatasets([...currentMounted, tableName]);
      }
      
      // Only set as active if it's a violations dataset
      if (datasetType === 'violations') {
        await DatabaseService.setActiveDataset(tableName);
        store.setActiveDatasetId(fileId);
        setIsDataLoaded(true, store.dataRowCount + rowCount);
        addLog(`Mounted and activated ${tableName} successfully (${rowCount.toLocaleString()} rows).`);
      } else {
        addLog(`Mounted ${tableName} successfully (${rowCount.toLocaleString()} rows). Background dataset loaded.`);
      }
      
    } catch (error) {
      console.error("Error processing file:", error);
      addLog(`Error: ${error.message}`);
    } finally {
      setUploadStatus(null);
    }
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }, [datasetType]);

  const handleFileInput = (e) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  return (
    <Card 
      className={`border-dashed border-2 transition-colors h-48 flex items-center justify-center ${isDragging ? 'border-primary bg-primary/10' : 'border-muted-foreground/25'}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <CardContent className="flex flex-col items-center justify-center p-6 text-center space-y-4 w-full h-full">
        {uploadStatus ? (
          <div className="flex flex-col items-center space-y-3">
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
            <p className="text-sm font-medium animate-pulse">
              {uploadStatus === 'writing' ? 'Writing to browser OPFS...' : 'Mounting into WASM Engine...'}
            </p>
          </div>
        ) : (
          <>
            <UploadCloud className="h-8 w-8 text-muted-foreground" />
            <div className="flex flex-col gap-1 w-full max-w-xs mx-auto">
              <h3 className="font-semibold text-base">Upload Local Parquet</h3>
              
              <div className="mt-2 text-left">
                <Select value={datasetType} onValueChange={setDatasetType}>
                  <SelectTrigger className="w-full h-8 text-xs">
                    <SelectValue placeholder="Select Dataset Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="violations">Violations Data</SelectItem>
                    <SelectItem value="segments">Segments Data</SelectItem>
                    <SelectItem value="adjacency">Adjacency Data</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <input 
              type="file" 
              accept=".parquet" 
              className="hidden" 
              id="file-upload" 
              onChange={handleFileInput}
            />
            <label 
              htmlFor="file-upload" 
              className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground shadow hover:bg-primary/90 h-8 px-4 py-1"
            >
              Select File
            </label>
          </>
        )}
      </CardContent>
    </Card>
  );
}
