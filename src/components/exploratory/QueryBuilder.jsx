import React from 'react';
import { Download, LayoutGrid, Columns, Layers } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select";

const AXIS_OPTIONS = [
  'Vehicle Type',
  'Offence Code',
  'Police Station',
  'Center Code'
];

export default function QueryBuilder({ xAxis, yAxis, onXChange, onYChange, onExport }) {
  return (
    <div className="w-full bg-card rounded-lg border shadow-sm flex flex-col">
      <div className="flex items-center gap-2 p-4 border-b">
        <LayoutGrid className="w-5 h-5 text-primary" />
        <div>
          <h2 className="text-lg font-semibold leading-none mb-1">Query Builder</h2>
          <p className="text-sm text-muted-foreground leading-none">Select dimensions to generate a dynamic pivot table.</p>
        </div>
      </div>
      
      <div className="p-4 flex flex-wrap items-end gap-6 bg-muted/20">
        <div className="flex flex-col gap-2 flex-1 min-w-[200px] max-w-[300px]">
          <label className="text-sm font-medium flex items-center gap-2">
            <Columns className="w-4 h-4 text-muted-foreground" />
            X-Axis (Columns)
          </label>
          <Select value={xAxis} onValueChange={onXChange}>
            <SelectTrigger className="w-full h-10 text-sm">
              <SelectValue placeholder="Select X-Axis" />
            </SelectTrigger>
            <SelectContent>
              {AXIS_OPTIONS.map((opt) => (
                <SelectItem key={opt} value={opt} disabled={opt === yAxis}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2 flex-1 min-w-[200px] max-w-[300px]">
          <label className="text-sm font-medium flex items-center gap-2">
            <Layers className="w-4 h-4 text-muted-foreground" />
            Y-Axis (Rows)
          </label>
          <Select value={yAxis} onValueChange={onYChange}>
            <SelectTrigger className="w-full h-10 text-sm">
              <SelectValue placeholder="Select Y-Axis" />
            </SelectTrigger>
            <SelectContent>
              {AXIS_OPTIONS.map((opt) => (
                <SelectItem key={opt} value={opt} disabled={opt === xAxis}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="ml-auto">
          <button
            onClick={onExport}
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 gap-2"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>
    </div>
  );
}
