import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Play, Eye, Trash2, Loader2 } from 'lucide-react';
import { useUiStore } from '@/store/useUiStore';
import { DatabaseService } from '@/services/database.service';
import { getFileFromOPFS, deleteFromOPFS, listOPFSFiles } from '@/lib/opfs';
import DataPreviewSheet from './DataPreviewSheet';

export default function DataRegistryTable() {
  const { availableDatasets, setAvailableDatasets, activeDatasetId, setActiveDatasetId, setIsDataLoaded, addLog } = useUiStore();
  const [previewFile, setPreviewFile] = useState(null);
  const [mountingId, setMountingId] = useState(null);

  const handleSetActive = async (fileMetadata) => {
    try {
      setMountingId(fileMetadata.id);
      addLog(`Mounting ${fileMetadata.name}...`);
      
      // Yield to let React render the optimistic mounting state
      await new Promise(resolve => setTimeout(resolve, 10));
      let buffer;
      if (fileMetadata.source === 'System Default') {
        buffer = await DatabaseService.fetchSystemDefault(fileMetadata.url);
      } else {
        const opfsFile = await getFileFromOPFS(fileMetadata.name);
        buffer = new Uint8Array(await opfsFile.arrayBuffer());
      }
      
      const rowCount = await DatabaseService.setActiveTable(fileMetadata.id, buffer);
      setActiveDatasetId(fileMetadata.id);
      setIsDataLoaded(true, rowCount);
      addLog(`Mounted ${fileMetadata.name} successfully (${rowCount.toLocaleString()} rows).`);
    } catch (e) {
      addLog(`Failed to mount ${fileMetadata.name}: ${e.message}`);
    } finally {
      setMountingId(null);
    }
  };

  const handleDelete = async (fileMetadata) => {
    if (fileMetadata.source === 'System Default') return; // Protected
    
    try {
      if (activeDatasetId === fileMetadata.id) {
        addLog(`Active Protection Guard triggered. Falling back to System Default before deletion.`);
        const sysDefs = availableDatasets.filter(d => d.source === 'System Default');
        if (sysDefs.length > 0) {
           await handleSetActive(sysDefs[0]);
        } else {
           setIsDataLoaded(false, 0);
           setActiveDatasetId(null);
        }
      }

      await deleteFromOPFS(fileMetadata.name);
      addLog(`Deleted ${fileMetadata.name} from OPFS.`);
      
      const opfsFiles = await listOPFSFiles();
      const sysDefaults = availableDatasets.filter(p => p.source === 'System Default');
      setAvailableDatasets([...sysDefaults, ...opfsFiles]);
    } catch (e) {
      addLog(`Failed to delete ${fileMetadata.name}: ${e.message}`);
    }
  };

  const formatSize = (bytes) => {
    if (!bytes) return 'N/A';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  return (
    <Card className="border shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Dataset Name</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>File Size</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {availableDatasets.map((file) => {
            const isActive = activeDatasetId === file.id;
            const isMounting = mountingId === file.id;
            return (
              <TableRow key={file.id} className={isActive ? 'bg-muted/50' : ''}>
                <TableCell className="font-medium">
                  {file.name}
                  {isActive && !isMounting && <Badge variant="secondary" className="ml-2 text-xs">ACTIVE</Badge>}
                  {isMounting && <Badge variant="outline" className="ml-2 text-xs border-primary text-primary animate-pulse">MOUNTING...</Badge>}
                </TableCell>
                <TableCell>
                  <Badge variant={file.source === 'System Default' ? 'outline' : 'default'}>
                    {file.source}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono text-muted-foreground">{formatSize(file.size)}</TableCell>
                <TableCell className="text-right space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={isActive || mountingId !== null}
                    onClick={() => handleSetActive(file)}
                  >
                    {isMounting ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Play className="w-4 h-4 mr-1" />}
                    {isMounting ? "Loading..." : "Set Active"}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setPreviewFile(file)}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Preview
                  </Button>
                  {file.source !== 'System Default' && (
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      onClick={() => handleDelete(file)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
          {availableDatasets.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                No datasets available.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      
      {/* Preview Sheet */}
      <DataPreviewSheet file={previewFile} onClose={() => setPreviewFile(null)} />
    </Card>
  );
}
