import React from 'react';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';

export default function GeospatialHeader() {
  return (
    <div className="flex flex-col gap-4 shrink-0 w-full">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">Geospatial Hotspot Analysis</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Identify where illegal parking is most concentrated across Bengaluru, enabling targeted enforcement and infrastructural interventions.
          </p>
        </div>
      </div>
      <Separator />
    </div>
  );
}
