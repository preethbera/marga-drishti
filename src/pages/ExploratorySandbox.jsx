import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download, LayoutGrid, Layers, Columns } from 'lucide-react';
import { AnalyticsService } from '@/services/analytics.service';
import { useAnalyticsQuery } from '@/hooks/useAnalyticsQuery';

export default function ExploratorySandbox() {
  const [xDimension, setXDimension] = useState('vehicle_type');
  const [yDimension, setYDimension] = useState('offence_code');
  const { data = { columns: [], rows: [] }, isLoading } = useAnalyticsQuery(
    () => AnalyticsService.getExploratoryData(xDimension, yDimension),
    [xDimension, yDimension],
    { useGlobalLoader: true }
  );
  
  const pivotData = data || { columns: [], rows: [] };

  function handleExport() {
    if (!pivotData || pivotData.rows.length === 0) return;
    
    // Build CSV
    const headers = [yDimension, ...pivotData.columns];
    let csv = headers.join(',') + '\n';
    
    pivotData.rows.forEach(row => {
      const rowData = headers.map(h => {
        let val = row[h] ?? 0;
        // Escape quotes
        if (typeof val === 'string') val = `"${val.replace(/"/g, '""')}"`;
        return val;
      });
      csv += rowData.join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `export_${xDimension}_vs_${yDimension}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const dimensions = [
    { value: 'vehicle_type', label: 'Vehicle Type' },
    { value: 'offence_code', label: 'Offence Code' },
    { value: 'center_code', label: 'Center Code' },
  ];

  return (
    <div className="flex flex-col w-full max-w-7xl mx-auto px-6 md:px-8 space-y-6 animate-in fade-in duration-500 min-h-screen">
      <div className="flex flex-col space-y-2 border-b pb-4">
        <h1 className="text-3xl font-bold tracking-tight">Exploratory Sandbox</h1>
        <p className="text-muted-foreground">
          Unstructured query builder for custom cross-referencing and data extraction.
        </p>
      </div>

      <Card className="shadow-sm border-border/50">
        <CardHeader className="bg-muted/30 border-b pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <LayoutGrid className="w-5 h-5 text-primary" />
            Query Builder
          </CardTitle>
          <CardDescription>Select dimensions to generate a dynamic pivot table.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row gap-6 pt-6 items-end">
          <div className="space-y-3 flex-1">
            <label className="text-sm font-semibold flex items-center gap-2 text-muted-foreground"><Columns className="w-4 h-4"/> X-Axis (Columns)</label>
            <Select value={xDimension} onValueChange={setXDimension}>
              <SelectTrigger className="bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {dimensions.map(d => (
                  <SelectItem key={d.value} value={d.value} disabled={d.value === yDimension}>{d.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-3 flex-1">
            <label className="text-sm font-semibold flex items-center gap-2 text-muted-foreground"><Layers className="w-4 h-4"/> Y-Axis (Rows)</label>
            <Select value={yDimension} onValueChange={setYDimension}>
              <SelectTrigger className="bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {dimensions.map(d => (
                  <SelectItem key={d.value} value={d.value} disabled={d.value === xDimension}>{d.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleExport} className="w-full md:w-auto font-semibold" variant="default">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </CardContent>
      </Card>

      <Card className="shadow-md">
        <CardContent className="p-0">
          <div className="rounded-md overflow-auto max-h-[600px]">
            <Table>
              <TableHeader className="bg-muted/50 sticky top-0 z-10 shadow-sm border-b">
                <TableRow>
                  <TableHead className="font-bold min-w-[200px] border-r bg-muted/80">{dimensions.find(d => d.value === yDimension)?.label}</TableHead>
                  {pivotData.columns.map(col => (
                    <TableHead key={col} className="text-right whitespace-nowrap font-semibold bg-muted/80">{col}</TableHead>
                  ))}
                  <TableHead className="text-right font-bold bg-primary/10 text-primary">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pivotData.rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={pivotData.columns.length + 2} className="text-center py-12 text-muted-foreground">
                      No data available or processing query...
                    </TableCell>
                  </TableRow>
                ) : (
                  pivotData.rows.map((row, i) => {
                    const rowTotal = pivotData.columns.reduce((sum, col) => sum + (row[col] || 0), 0);
                    return (
                      <TableRow key={i} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="font-medium border-r bg-background/95 sticky left-0 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">{row[yDimension]}</TableCell>
                        {pivotData.columns.map(col => (
                          <TableCell key={col} className="text-right font-mono text-sm">
                            {row[col] ? row[col].toLocaleString() : '-'}
                          </TableCell>
                        ))}
                        <TableCell className="text-right font-bold font-mono bg-primary/5 text-primary">
                          {rowTotal.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
