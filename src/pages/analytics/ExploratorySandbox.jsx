import React, { useEffect } from 'react';
import { useDataStore } from '../../store/useDataStore';
import { useExploratoryStore } from '../../store/useExploratoryStore';
import QueryBuilder from '../../components/exploratory/QueryBuilder';
import PivotTableCanvas from '../../components/exploratory/PivotTableCanvas';
import { Loader2 } from 'lucide-react';

export default function ExploratorySandbox() {
  const { isEngineReady, initializeDataEngine, syncMessage, error: engineError } = useDataStore();
  
  const { 
    xAxis, 
    yAxis, 
    pivotData, 
    isLoading, 
    error: storeError, 
    setXAxis, 
    setYAxis,
    generatePivot
  } = useExploratoryStore();

  // Initialize engine on mount
  useEffect(() => {
    initializeDataEngine();
  }, [initializeDataEngine]);

  // Generate initial pivot data once engine is ready
  useEffect(() => {
    if (isEngineReady) {
      generatePivot();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEngineReady]);

  const handleExport = () => {
    if (!pivotData || pivotData.numRows === 0) return;
    
    const columns = pivotData.schema.fields.map(f => f.name);
    const rows = [];
    
    // Header row
    rows.push(columns.map(c => `"${c.replace(/"/g, '""')}"`).join(","));
    
    // Data rows
    for (let i = 0; i < pivotData.numRows; i++) {
      const rowValues = columns.map(col => {
        const val = pivotData.getChild(col).get(i);
        if (val === null || val === undefined) return '0';
        if (typeof val === 'string') return `"${val.replace(/"/g, '""')}"`;
        return val;
      });
      rows.push(rowValues.join(","));
    }
    
    const blob = new Blob([rows.join("\n")], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Exploratory_Sandbox_${xAxis.replace(/\s+/g, '_')}_vs_${yAxis.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const isDataLoading = !isEngineReady || isLoading;
  const currentError = engineError || storeError;

  return (
    <div className="flex flex-col h-[calc(100vh-theme(spacing.16))] w-full overflow-y-auto custom-scrollbar animate-in fade-in duration-500 bg-background relative">
      <div className="w-full flex flex-col gap-6 p-6 pb-8 max-w-[1600px] mx-auto">
        
        {/* Page Header */}
        <div className="flex flex-col gap-1 w-full shrink-0">
          <h1 className="text-3xl font-bold tracking-tight">Exploratory Sandbox</h1>
          <p className="text-muted-foreground">
            Cross-tabulate any two dimensions — vehicle type, offence code, police station, division — to surface evidence patterns ASTraM analysts can act on.
          </p>
        </div>

        {/* Query Builder */}
        <div className="shrink-0">
          <QueryBuilder 
            xAxis={xAxis}
            yAxis={yAxis}
            onXChange={setXAxis}
            onYChange={setYAxis}
            onExport={handleExport}
          />
        </div>

        {/* Pivot Table Canvas */}
        <div className="flex-1 min-h-[400px]">
          <PivotTableCanvas 
            data={pivotData} 
            yAxisLabel={yAxis} 
          />
        </div>
      </div>

      {/* Loading Overlay */}
      {isDataLoading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/50 backdrop-blur-sm transition-all pointer-events-none">
          <div className="flex flex-col items-center gap-2 bg-card p-6 rounded-lg shadow-lg border max-w-md text-center pointer-events-auto">
            {currentError ? (
              <>
                <div className="text-destructive font-bold mb-2">Error</div>
                <div className="text-sm text-muted-foreground break-words">{currentError}</div>
              </>
            ) : (
              <>
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <span className="text-sm font-medium">
                  {!isEngineReady ? syncMessage : 'Generating Pivot Table...'}
                </span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
