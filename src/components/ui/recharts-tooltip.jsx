import React from 'react';

export function CustomChartTooltip({ active, payload, label, formatter, labelFormatter }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border p-3 rounded-lg shadow-md text-sm">
        {labelFormatter ? (
          <p className="font-semibold text-foreground mb-2">{labelFormatter(label)}</p>
        ) : (
          label && <p className="font-semibold text-foreground mb-2">{label}</p>
        )}
        <div className="flex flex-col gap-1">
          {payload.map((entry, index) => {
            const formatted = formatter ? formatter(entry.value, entry.name, entry, index) : [entry.value, entry.name];
            const displayValue = Array.isArray(formatted) ? formatted[0] : formatted;
            const displayName = Array.isArray(formatted) ? formatted[1] : entry.name;
            
            return (
              <div key={`item-${index}`} className="flex items-center gap-2">
                <div 
                  className="w-2 h-2 rounded-full" 
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-muted-foreground">{displayName}:</span>
                <span className="font-medium text-foreground">{displayValue}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  return null;
}
