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
  const { availableDatasets, setAvailableDatasets, mountedDatasets, activeDatasetId, setActiveDatasetId, setIsDataLoaded, addLog } = useUiStore();
  const [previewFile, setPreviewFile] = useState(null);
  const [activatingId, setActivatingId] = useState(null);

  const handleSetActive = async (fileMetadata) => {
    try {
      setActivatingId(fileMetadata.id);
      addLog(`Setting ${fileMetadata.name} as active dataset...`);
      
      const tableName = fileMetadata.name.split('/').pop().replace('.parquet', '').replace(/[^a-zA-Z0-9_]/g, '_');
      const rowCount = await DatabaseService.setActiveDataset(tableName);
      
      setActiveDatasetId(fileMetadata.id);
      setIsDataLoaded(true, rowCount); // this might overwrite total loaded count, but that's fine for now or we keep it as is
      addLog(`Activated ${fileMetadata.name} successfully.`);
    } catch (e) {
      addLog(`Failed to activate ${fileMetadata.name}: ${e.message}`);
    } finally {
      setActivatingId(null);
    }
  };

  const handleDelete = async (fileMetadata) => {
    if (fileMetadata.source === 'System Default') return; // Protected
    
    try {
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
            <TableHead>Category</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>File Size</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {availableDatasets.map((file) => {
            const tableName = file.name.split('/').pop().replace('.parquet', '').replace(/[^a-zA-Z0-9_]/g, '_');
            const isMounted = mountedDatasets?.includes(tableName) || mountedDatasets?.includes('t_' + tableName);
            const isActive = activeDatasetId === file.id;
            const isActivating = activatingId === file.id;
            const isViolations = file.type === 'violations';

            return (
              <TableRow key={file.id} className={isActive ? 'bg-primary/5' : (isMounted ? 'bg-muted/50' : '')}>
                <TableCell className="font-medium">
                  {file.displayName || file.name.split('/').pop()}
                  {isMounted && !isActive && <Badge variant="secondary" className="ml-2 text-xs">MOUNTED</Badge>}
                  {isActive && <Badge variant="default" className="ml-2 text-xs">ACTIVE</Badge>}
                  {isActivating && <Badge variant="outline" className="ml-2 text-xs border-primary text-primary animate-pulse">ACTIVATING...</Badge>}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="capitalize">
                    {file.type || 'unknown'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={file.source === 'System Default' ? 'outline' : 'default'}>
                    {file.source}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono text-muted-foreground">{formatSize(file.size)}</TableCell>
                <TableCell className="text-right space-x-2">
                  {isViolations && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      disabled={isActive || activatingId !== null || !isMounted}
                      onClick={() => handleSetActive(file)}
                    >
                      {isActivating ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Play className="w-4 h-4 mr-1" />}
                      {isActivating ? "Activating..." : "Set Active"}
                    </Button>
                  )}
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
