import React from 'react';
import { Download } from 'lucide-react';
import { Button } from '../ui/button';
import { DatePickerWithRange } from '../ui/date-range-picker';

export default function Header({ dateRange, onDateRangeChange, onPredefinedRange }) {
  const handleDownload = () => {
    window.print();
  };

  return (
    <div className="flex flex-col gap-4 executive-header">
      <div className="pb-4 border-b">
        <h1 className="text-3xl font-bold tracking-tight">Executive Summary</h1>
        <p className="text-muted-foreground mt-1">
          High-level operational overview of Bengaluru traffic enforcement — built directly from the BTP/ASTraM violation dataset.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 print-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-muted/20 p-2 rounded-lg border w-full lg:w-auto">
          <span className="text-sm font-medium text-muted-foreground ml-2">Timeframe:</span>
          <div className="flex flex-wrap gap-1">
            <Button variant="ghost" size="sm" onClick={() => onPredefinedRange(15)}>15 Days</Button>
            <Button variant="ghost" size="sm" onClick={() => onPredefinedRange(30)}>30 Days</Button>
            <Button variant="ghost" size="sm" onClick={() => onPredefinedRange(60)}>60 Days</Button>
            <Button variant="ghost" size="sm" onClick={() => onPredefinedRange(90)}>90 Days</Button>
          </div>
          <div className="hidden sm:block w-px h-6 bg-border mx-2"></div>
          <DatePickerWithRange date={dateRange} setDate={onDateRangeChange} />
        </div>

        <Button variant="outline" onClick={handleDownload} className="shrink-0 w-full lg:w-auto">
          <Download className="mr-2 h-4 w-4" />
          Download briefing
        </Button>
      </div>
    </div>
  );
}
