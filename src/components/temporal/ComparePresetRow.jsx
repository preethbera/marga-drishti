import React from 'react';
import { Button } from '../ui/button';
import { Info } from 'lucide-react';

const COMPARE_PRESETS = [
  {
    label: 'AM vs PM Peak',
    a: { timeRange: [8, 11], dayOfWeek: 'all' },
    b: { timeRange: [17, 21], dayOfWeek: 'all' }
  },
  {
    label: 'Weekday vs Weekend',
    a: { timeRange: [0, 23], dayOfWeek: 'Tuesday' },
    b: { timeRange: [0, 23], dayOfWeek: 'Saturday' }
  },
  {
    label: 'Day vs Night',
    a: { timeRange: [9, 17], dayOfWeek: 'all' },
    b: { timeRange: [22, 23], dayOfWeek: 'all' }
  }
];

export default function ComparePresetRow({ onSelectComparePreset }) {
  return (
    <div className="flex items-center justify-between px-6 py-2 bg-muted/20 border-y w-full shrink-0">
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold uppercase text-muted-foreground">Quick compares:</span>
        <div className="flex gap-2">
          {COMPARE_PRESETS.map((preset) => (
            <Button
              key={preset.label}
              variant="outline"
              size="sm"
              className="h-7 text-[11px] rounded-full px-3"
              onClick={() => onSelectComparePreset(preset.a, preset.b)}
            >
              {preset.label}
            </Button>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
        <Info className="w-3.5 h-3.5" />
        <span>Maps share viewport — zoom/pan one to move both.</span>
      </div>
    </div>
  );
}
