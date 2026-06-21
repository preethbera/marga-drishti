import React, { useState } from "react";
import FilterSidebar from "@components/custom/FilterSidebar";
import MapContainer from "@components/custom/MapContainer";
import { useUiStore } from '@core/store/useUiStore';
import { Card, CardContent } from "@components/ui/card";
import { Link } from "react-router-dom";
import { Map, ArrowRight } from "lucide-react";

export default function Hotspot() {
  const [mapData, setMapData] = useState(null);
  const { isDataLoaded } = useUiStore();

  return (
    <div className="flex flex-1 flex-col gap-4 h-full">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Geospatial Dashboard</h1>
        <p className="text-muted-foreground">High-performance geospatial visualization of Bengaluru traffic violations.</p>
      </div>

      {!isDataLoaded ? (
        <div className="flex flex-1 items-center justify-center border-2 border-dashed rounded-xl p-8 bg-muted/20">
          <Card className="max-w-md w-full border-none shadow-none bg-transparent">
            <CardContent className="flex flex-col items-center justify-center text-center space-y-6 pt-6">
              <Map className="w-16 h-16 text-muted-foreground opacity-50" />
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold tracking-tight">No Data Loaded</h2>
                <p className="text-muted-foreground text-sm">
                  The DuckDB WASM engine requires a local Parquet file to render the dashboard. 
                  Please upload your dataset first.
                </p>
              </div>
              <Link 
                to="/data-ingestion" 
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-10 px-6 py-2"
              >
                Go to Data Management
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="flex flex-1 min-h-[60vh] gap-4">
          <FilterSidebar onDataUpdate={setMapData} />
          <div className="flex-1">
            <MapContainer mapData={mapData} />
          </div>
        </div>
      )}
    </div>
  );
}
