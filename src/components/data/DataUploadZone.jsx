import React, { useCallback, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { UploadCloud, Loader2 } from 'lucide-react';
import { useUiStore } from '@/store/useUiStore';
import { saveToOPFS, listOPFSFiles, getFileFromOPFS } from '@/lib/opfs';
import { setActiveTable } from '@/lib/duckdbEngine';

export default function DataUploadZone() {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null); // null, 'writing', 'mounting'
  const { addLog, availableDatasets, setAvailableDatasets, setActiveDatasetId, setIsDataLoaded } = useUiStore();

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
      addLog(`Writing ${file.name} to OPFS...`);
      setUploadStatus('writing');
      
      const uniqueName = await saveToOPFS(file);
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
      const rowCount = await setActiveTable(fileId, buffer);
      
      setActiveDatasetId(fileId);
      setIsDataLoaded(true, rowCount);
      addLog(`Mounted ${uniqueName} successfully (${rowCount.toLocaleString()} rows).`);
      
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
  }, []);

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
            <UploadCloud className="h-10 w-10 text-muted-foreground" />
            <div className="flex flex-col gap-1">
              <h3 className="font-semibold text-lg">Upload Local Parquet</h3>
              <p className="text-sm text-muted-foreground">Drag and drop file here, or click to browse. File will be cached in OPFS.</p>
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
              className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2"
            >
              Select File
            </label>
          </>
        )}
      </CardContent>
    </Card>
  );
}
