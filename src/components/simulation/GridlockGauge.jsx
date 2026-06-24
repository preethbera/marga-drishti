import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSimulationStore } from '@/store/useSimulationStore';
import Latex from "react-latex-next";

export default function GridlockGauge() {
  const { trafficDensity, results } = useSimulationStore();
  const { K_j_eff, isGridlocked } = results;

  const maxK = Math.max(K_j_eff, 150); // Ensure the gauge has a sensible max scale
  const ratio = Math.min(trafficDensity / K_j_eff, 1);
  const percentage = isNaN(ratio) ? 0 : ratio * 100;

  // Determine color and status
  let color = "text-green-500 bg-green-500";
  let stroke = "#22c55e";
  let status = "Safe";
  
  if (isGridlocked) {
    color = "text-red-500 bg-red-500 animate-pulse";
    stroke = "#ef4444";
    status = "Traffic Jam";
  } else if (percentage > 85) {
    color = "text-red-500 bg-red-500";
    stroke = "#ef4444";
    status = "Critical";
  } else if (percentage > 60) {
    color = "text-amber-500 bg-amber-500";
    stroke = "#f59e0b";
    status = "Marginal";
  }

  // SVG Arc calculation
  const radius = 80;
  const strokeWidth = 16;
  const normalizedRadius = radius - strokeWidth * 2;
  const circumference = normalizedRadius * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <Card className="border-sidebar-border bg-sidebar shadow-md h-full flex flex-col">
      <CardHeader className="pb-0">
        <CardTitle className="text-lg">Jam Threshold</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col items-center justify-center p-6 relative">
        <div className="relative w-48 h-24 mb-6">
          {/* Background Arc */}
          <svg height="100%" width="100%" viewBox="0 0 160 80" className="overflow-visible">
            <path
              d={`M ${strokeWidth * 2} 80 A ${normalizedRadius} ${normalizedRadius} 0 0 1 ${160 - strokeWidth * 2} 80`}
              fill="transparent"
              stroke="#334155"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />
            {/* Value Arc */}
            <path
              d={`M ${strokeWidth * 2} 80 A ${normalizedRadius} ${normalizedRadius} 0 0 1 ${160 - strokeWidth * 2} 80`}
              fill="transparent"
              stroke={stroke}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-500 ease-in-out"
            />
          </svg>
          
          <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center translate-y-4">
            <span className={`text-2xl font-bold tracking-tight ${color.split(' ')[0]}`}>
              {percentage.toFixed(1)}%
            </span>
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground mt-1">
              {status}
            </span>
          </div>
        </div>

        <div className="w-full mt-4 space-y-4">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Current <Latex>{String.raw`$K$`}</Latex></span>
            <span className="font-mono">{trafficDensity.toFixed(1)}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Jam <Latex>{String.raw`$K_{j,eff}$`}</Latex></span>
            <span className="font-mono">{K_j_eff.toFixed(1)}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Margin</span>
            <span className="font-mono text-emerald-500">
              {Math.max(0, K_j_eff - trafficDensity).toFixed(1)}
            </span>
          </div>
          
          <div className="h-2 w-full bg-secondary rounded-full overflow-hidden mt-4">
            <div 
              className={`h-full transition-all duration-500 ${color.split(' ')[1]}`} 
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
