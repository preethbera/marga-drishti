import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSimulationStore } from '@/store/useSimulationStore';
import { InlineMath } from 'react-katex';

export default function SpeedLossAttribution() {
  const { results } = useSimulationStore();
  const { attribution } = results;
  const { vFreeFlow, vNoParking, vActual, densityLoss, parkingLoss, totalLoss } = attribution;

  // Calculate percentages for the stacked bar
  const pActual = (vActual / vFreeFlow) * 100;
  const pParking = (parkingLoss / vFreeFlow) * 100;
  const pDensity = (densityLoss / vFreeFlow) * 100;

  return (
    <Card className="border-sidebar-border bg-sidebar shadow-md h-full flex flex-col">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Speed Loss Attribution</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 space-y-6">
        {/* Stacked Bar Chart */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>0</span>
            <span><InlineMath math="V_F = 67" /> km/h</span>
          </div>
          <div className="h-8 w-full flex rounded-md overflow-hidden bg-secondary">
            {pActual > 0 && (
              <div 
                className="bg-green-500 h-full flex items-center justify-center text-xs font-bold text-white transition-all duration-300 relative group"
                style={{ width: `${pActual}%` }}
              >
                {pActual > 10 && `${vActual.toFixed(1)}`}
                <div className="absolute opacity-0 group-hover:opacity-100 bg-black text-white p-1 rounded text-xs -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap z-50 transition-opacity">
                  Actual Speed: {vActual.toFixed(1)} km/h
                </div>
              </div>
            )}
            {pParking > 0 && (
              <div 
                className="bg-red-500 h-full flex items-center justify-center text-xs font-bold text-white transition-all duration-300 relative group"
                style={{ width: `${pParking}%` }}
              >
                {pParking > 10 && `-${parkingLoss.toFixed(1)}`}
                <div className="absolute opacity-0 group-hover:opacity-100 bg-black text-white p-1 rounded text-xs -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap z-50 transition-opacity">
                  Parking Loss: {parkingLoss.toFixed(1)} km/h
                </div>
              </div>
            )}
            {pDensity > 0 && (
              <div 
                className="bg-slate-500 h-full flex items-center justify-center text-xs font-bold text-white transition-all duration-300 relative group"
                style={{ width: `${pDensity}%` }}
              >
                {pDensity > 10 && `-${densityLoss.toFixed(1)}`}
                <div className="absolute opacity-0 group-hover:opacity-100 bg-black text-white p-1 rounded text-xs -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap z-50 transition-opacity">
                  Density Loss: {densityLoss.toFixed(1)} km/h
                </div>
              </div>
            )}
          </div>
          <div className="flex gap-4 text-xs mt-2 justify-center">
            <div className="flex items-center gap-1"><div className="w-3 h-3 bg-green-500 rounded-sm"></div>Remaining</div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 bg-red-500 rounded-sm"></div>Parking Loss</div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 bg-slate-500 rounded-sm"></div>Density Loss</div>
          </div>
        </div>

        {/* Detailed Table */}
        <div className="border border-sidebar-border rounded-md overflow-hidden bg-background">
          <table className="w-full text-sm text-left">
            <tbody>
              <tr className="border-b border-sidebar-border/50">
                <td className="p-2 text-muted-foreground">Free-Flow Speed <InlineMath math="(V_F)" /></td>
                <td className="p-2 text-right font-mono">{vFreeFlow.toFixed(1)}</td>
              </tr>
              <tr className="border-b border-sidebar-border/50 bg-slate-500/10">
                <td className="p-2 text-slate-400">Density-induced Loss</td>
                <td className="p-2 text-right font-mono text-slate-400">-{densityLoss.toFixed(1)}</td>
              </tr>
              <tr className="border-b border-sidebar-border/50">
                <td className="p-2 text-muted-foreground">Speed without parking</td>
                <td className="p-2 text-right font-mono">{vNoParking.toFixed(1)}</td>
              </tr>
              <tr className="border-b border-sidebar-border/50 bg-red-500/10">
                <td className="p-2 text-red-400">Parking-induced Loss</td>
                <td className="p-2 text-right font-mono text-red-400">-{parkingLoss.toFixed(1)}</td>
              </tr>
              <tr className="font-bold bg-muted/50">
                <td className="p-2">Actual Predicted Speed <InlineMath math="(V)" /></td>
                <td className="p-2 text-right font-mono text-green-500">{vActual.toFixed(1)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
