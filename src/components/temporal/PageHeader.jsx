import React from 'react';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';

export default function PageHeader() {
  return (
    <div className="flex flex-col gap-4 shrink-0 w-full">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">Temporal Hotspot Analysis</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Identify when illegal parking chokes Bengaluru carriageways, so enforcement patrols can be scheduled, not just dispatched.
          </p>
        </div>
      </div>
      <Separator />
    </div>
  );
}
