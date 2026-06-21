import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card';
import { useUiStore } from '@core/store/useUiStore';
import { Database, CheckCircle2, AlertCircle } from 'lucide-react';

export default function DataStatusCard() {
  const { isDataLoaded, dataRowCount } = useUiStore();

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Database className="w-5 h-5 text-muted-foreground" />
          DuckDB Engine Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3 mt-4">
          {isDataLoaded ? (
            <CheckCircle2 className="w-8 h-8 text-green-500" />
          ) : (
            <AlertCircle className="w-8 h-8 text-yellow-500" />
          )}
          <div>
            <div className="font-semibold text-base">
              {isDataLoaded ? 'Ready' : 'Awaiting Data'}
            </div>
            <div className="text-sm text-muted-foreground">
              {isDataLoaded 
                ? 'Data registered in WASM memory' 
                : 'Please upload a parquet file'}
            </div>
          </div>
        </div>
        
        {isDataLoaded && (
          <div className="pt-4 border-t border-border">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground block">Rows Loaded</span>
                <span className="font-mono font-bold text-lg">{dataRowCount.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-muted-foreground block">Table Name</span>
                <span className="font-mono">traffic_violations</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
