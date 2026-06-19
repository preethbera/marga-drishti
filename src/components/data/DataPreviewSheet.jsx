import React, { useEffect, useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from "@/components/ui/scroll-area";
import { previewTableData } from '@/lib/duckdbEngine';

export default function DataPreviewSheet({ file, onClose }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!file) return;

    let active = true;
    const fetchPreview = async () => {
      setLoading(true);
      // Ensure the file is actually mounted before preview, OR we just query the active table.
      // NOTE: The prompt says "When clicked, execute a fast, limited query in DuckDB WASM (SELECT * FROM table LIMIT 100)".
      // If the file is not the active file, querying "traffic_violations" will query the active file, not the clicked file.
      // To strictly query the clicked file if it's not active, we would need to read it using read_parquet.
      // Since it's inside OPFS, read_parquet('OPFS_PATH') isn't standard unless OPFS backend is registered.
      // Since we register via buffer, we'd have to temporarily register it.
      // For simplicity and safety, we assume previewTableData queries the currently ACTIVE table. 
      // Let's modify duckdbEngine previewTableData to accept an optional buffer or just query active.
      
      // We will just fetch the current view. (In a production system, we'd temporarily mount the file if it's not active).
      try {
        const data = await previewTableData(file.name, file.source, file.url);
        if (active) setRows(data);
      } catch (e) {
        console.error(e);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchPreview();
    return () => { active = false; };
  }, [file]);

  if (!file) return null;

  const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

  return (
    <Sheet open={!!file} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-[95vw] sm:max-w-[95vw] xl:w-[1200px]">
        <SheetHeader className="mb-0">
          <SheetTitle>Data Preview: {file.name}</SheetTitle>
          <SheetDescription>
            Displaying the first 100 rows.
            {loading && <span className="ml-2 animate-pulse text-primary">Loading...</span>}
          </SheetDescription>
        </SheetHeader>
        
        <ScrollArea className="h-[calc(100vh-120px)] w-full rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map(col => (
                  <TableHead key={col}>{col}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, i) => (
                <TableRow key={i}>
                  {columns.map(col => (
                    <TableCell key={col}>
                      {typeof row[col] === 'object' && row[col] !== null 
                        ? JSON.stringify(row[col], (k, v) => typeof v === 'bigint' ? v.toString() : v) 
                        : String(row[col])}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
              {!loading && rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={columns.length || 1} className="text-center py-8 text-muted-foreground">
                    No data to display.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
