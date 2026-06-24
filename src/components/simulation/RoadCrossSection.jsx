import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSimulationStore } from '@/store/useSimulationStore';
import Latex from "react-latex-next";

export default function RoadCrossSection() {
  const { roadWidth, parkedPCU, results } = useSimulationStore();
  const { W_eff } = results;

  // Calculations for visual rendering
  const maxWidth = 20; // max scale
  const scale = 100 / maxWidth; // 1 meter = X% width

  const totalWidthPct = roadWidth * scale;
  const blockedWidth = roadWidth - W_eff;
  const blockedWidthPct = blockedWidth * scale;
  const usableWidthPct = W_eff * scale;

  // Determine colors based on W_eff
  let usableColor = "bg-green-500";
  if (W_eff < 3.6) usableColor = "bg-red-500";
  else if (W_eff <= 7.2) usableColor = "bg-amber-500";

  const numLanes = Math.floor(roadWidth / 3.6);
  const laneMarkers = Array.from({ length: numLanes - 1 }).map((_, i) => (i + 1) * 3.6);

  return (
    <Card className="border-sidebar-border bg-sidebar shadow-md h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Physical Road Cross-Section</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-center">
        
        {/* KPI Headers */}
        <div className="flex justify-between items-end mb-6">
          <div>
            <p className="text-sm text-muted-foreground">Total Width</p>
            <p className="font-mono text-lg">{roadWidth.toFixed(1)}m</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Blocked</p>
            <p className="font-mono text-lg text-red-500">{blockedWidth.toFixed(1)}m</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Usable</p>
            <p className={`font-mono text-lg ${usableColor.replace('bg-', 'text-')}`}>
              {W_eff.toFixed(1)}m
            </p>
          </div>
        </div>

        {/* Visualizer */}
        <div className="relative w-full h-32 bg-secondary rounded-lg overflow-hidden border border-border mt-4">
          
          {/* Base Road Bed */}
          <div 
            className="absolute top-0 bottom-0 left-0 bg-slate-700 transition-all duration-300"
            style={{ width: `${totalWidthPct}%` }}
          >
            {/* Lane Dividers */}
            {laneMarkers.map(marker => (
              <div 
                key={marker}
                className="absolute top-0 bottom-0 w-0.5 bg-white/30 border-l border-dashed border-white/50"
                style={{ left: `${(marker / roadWidth) * 100}%` }}
              />
            ))}
          </div>

          {/* Blocked Area (Hatching) */}
          {blockedWidth > 0 && (
            <div 
              className="absolute top-0 bottom-0 left-0 bg-red-900/80 transition-all duration-300 border-r-2 border-red-500 flex items-center justify-center overflow-hidden"
              style={{ 
                width: `${blockedWidthPct}%`,
                backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(239, 68, 68, 0.2) 10px, rgba(239, 68, 68, 0.2) 20px)'
              }}
            >
              {blockedWidth >= 1.0 && <span className="text-xs font-bold text-red-200 rotate-[-90deg] whitespace-nowrap">PARKED</span>}
            </div>
          )}

          {/* Usable Area Highlight */}
          <div 
            className={`absolute top-0 bottom-0 opacity-20 transition-all duration-300 ${usableColor}`}
            style={{ 
              left: `${blockedWidthPct}%`,
              width: `${usableWidthPct}%` 
            }}
          />

          {/* Warnings Overlay */}
          {W_eff <= 1.0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                MIN PASSABLE
              </div>
            </div>
          )}
          {W_eff < 3.6 && W_eff > 1.0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-amber-500/80 text-white text-xs font-bold px-2 py-1 rounded backdrop-blur-sm">
                SUB-LANE WIDTH
              </div>
            </div>
          )}
        </div>
        
        {/* Dimension Arrows */}
        <div className="relative w-full h-8 mt-2">
          {blockedWidth > 0 && (
            <div 
              className="absolute top-1/2 -translate-y-1/2 flex items-center justify-center text-[10px] text-red-400 border-t border-red-400/50"
              style={{ left: 0, width: `${blockedWidthPct}%` }}
            >
              <div className="absolute left-0 h-2 w-[1px] bg-red-400"></div>
              <span className="bg-sidebar px-1 absolute -top-2">{blockedWidth.toFixed(1)}m</span>
              <div className="absolute right-0 h-2 w-[1px] bg-red-400"></div>
            </div>
          )}
          <div 
            className={`absolute top-1/2 -translate-y-1/2 flex items-center justify-center text-[10px] ${usableColor.replace('bg-', 'text-')} border-t border-current/50`}
            style={{ left: `${blockedWidthPct}%`, width: `${usableWidthPct}%` }}
          >
            <div className="absolute left-0 h-2 w-[1px] bg-current"></div>
            <span className="bg-sidebar px-1 absolute -top-2">{W_eff.toFixed(1)}m</span>
            <div className="absolute right-0 h-2 w-[1px] bg-current"></div>
          </div>
        </div>

      </CardContent>
    </Card>
  );
}
