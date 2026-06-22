import React from 'react';

export default function MapTooltip({ object, x, y, isDetailed }) {
  if (!object) return null;

  if (isDetailed) {
    // Heatmap doesn't generally have per-point hover natively without more complex picking.
    // But if we do, handle here. We won't show tooltip for heatmap layer typically.
    return null; 
  }

  // Scatterplot tooltip for centers
  return (
    <div 
      className="absolute z-50 pointer-events-none p-3 bg-background border rounded-lg shadow-lg text-sm flex flex-col gap-1 min-w-[150px] animate-in fade-in zoom-in duration-200"
      style={{ left: x, top: y, transform: 'translate(-50%, -100%)', marginTop: '-12px' }}
    >
      <div className="font-semibold text-foreground border-b pb-1 mb-1 truncate">
        {object.name || 'Unknown Center'}
      </div>
      <div className="flex justify-between items-center text-muted-foreground">
        <span>Code:</span>
        <span className="font-medium text-foreground">{object.code}</span>
      </div>
      <div className="flex justify-between items-center text-muted-foreground">
        <span>Violations:</span>
        <span className="font-bold text-primary">{object.count.toLocaleString()}</span>
      </div>
    </div>
  );
}
