import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, ReferenceDot, ReferenceArea } from 'recharts';
import { useSimulationStore } from '@core/store/useSimulationStore';
import { useSimulationDerived, useSensitivityCurve } from '@core/hooks/useSimulationHooks';
import { SIMULATION_CHART_CONFIG } from '../simulationConfig';
import { MODEL_CONSTANTS } from '@core/simulation/modelEngine';

const CustomTooltip = ({ active, payload, maxPCU }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const isGridlocked = data.V === 0 && data.PCU > 0;
    
    // Find local derivative roughly
    let derivText = null;
    if (data.V > 0 && payload[0].payload.PCU < maxPCU - 0.1) {
      // Very rough marginal loss estimation: since log is convex, just note the trend
      // A proper derivative would be dV/dPCU, but let's just use the curve shape
    }
    
    return (
      <div className="bg-background border border-border p-3 rounded shadow-md text-sm">
        <p className="font-semibold mb-1">Blockage: {data.PCU.toFixed(1)} PCU</p>
        <p>Predicted Speed: {data.V.toFixed(1)} km/h</p>
        {isGridlocked && <p className="text-red-500 font-bold mt-1">Gridlocked</p>}
      </div>
    );
  }
  return null;
};

export function SensitivitySweep() {
  const { W_total, PCU_parked, K } = useSimulationStore();
  const derived = useSimulationDerived(W_total, PCU_parked, K);
  const sensitivityCurve = useSensitivityCurve(W_total, K);

  const { maxPCU, gridlockPCU, V } = derived;

  const isAlreadyGridlocked = gridlockPCU <= 0;
  const noHeadroom = maxPCU <= 0;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex justify-between items-center">
          <span>Sensitivity Sweep: Speed vs. Parked PCU</span>
          <span className="text-sm font-normal text-muted-foreground">
            Reference Density K = {K} veh/km
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 relative min-h-[300px]">
        
        {isAlreadyGridlocked ? (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10 text-center p-6 border border-red-500/20 rounded-md">
            <p className="text-lg font-medium text-red-500">
              Road is already gridlocked at this density — even zero parked vehicles produce V = 0 km/h.
            </p>
          </div>
        ) : noHeadroom ? (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10 text-center p-6 border border-amber-500/20 rounded-md">
            <p className="text-lg font-medium text-amber-500">
              Road width is at the minimum — no parking headroom available.
            </p>
          </div>
        ) : null}

        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={sensitivityCurve} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis 
              dataKey="PCU" 
              type="number"
              domain={[0, Math.min(maxPCU, gridlockPCU * 1.5 || 10)]} // Sensible visual max
              label={{ value: SIMULATION_CHART_CONFIG.axes.PCULabel, position: 'insideBottom', offset: -10 }}
              tickFormatter={(v) => v.toFixed(1)}
              allowDataOverflow
            />
            <YAxis 
              dataKey="V"
              domain={[0, MODEL_CONSTANTS.V_F + 5]}
              label={{ value: SIMULATION_CHART_CONFIG.axes.VLabel, angle: -90, position: 'insideLeft' }}
            />
            <Tooltip content={<CustomTooltip maxPCU={maxPCU} />} />
            
            {/* Gridlock Zone Shading */}
            {gridlockPCU > 0 && gridlockPCU <= maxPCU && (
              <ReferenceArea 
                x1={gridlockPCU} 
                x2={Math.min(maxPCU, gridlockPCU * 1.5 || 10)} 
                fill={SIMULATION_CHART_CONFIG.gridlock.color} 
                fillOpacity={0.1} 
              />
            )}

            <Area 
              type="monotone" 
              dataKey="V" 
              stroke={SIMULATION_CHART_CONFIG.currentCurveColor} 
              fillOpacity={0.2} 
              fill={SIMULATION_CHART_CONFIG.currentCurveColor} 
              isAnimationActive={false}
            />

            {/* Reference Lines */}
            <ReferenceLine y={MODEL_CONSTANTS.V_O} stroke={SIMULATION_CHART_CONFIG.referenceLineColor} strokeDasharray="3 3" label={{ position: 'insideTopLeft', value: 'Optimum Speed', fill: SIMULATION_CHART_CONFIG.referenceLineColor, fontSize: 12 }} />
            
            <ReferenceLine 
              x={PCU_parked} 
              stroke={SIMULATION_CHART_CONFIG.currentKLineColor} 
              strokeDasharray="5 5" 
              label={{ position: 'top', value: `Current: ${PCU_parked.toFixed(1)} PCU`, fill: SIMULATION_CHART_CONFIG.currentKLineColor, fontSize: 12 }} 
            />

            {gridlockPCU > 0 && gridlockPCU <= maxPCU && (
              <ReferenceLine 
                x={gridlockPCU} 
                stroke={SIMULATION_CHART_CONFIG.gridlock.color} 
                strokeDasharray="5 5" 
                label={{ position: 'top', value: `Gridlock at ${gridlockPCU.toFixed(1)} PCU`, fill: SIMULATION_CHART_CONFIG.gridlock.color, fontSize: 12 }} 
              />
            )}

            {/* Current State Dot */}
            {!isAlreadyGridlocked && (
              <ReferenceDot 
                x={PCU_parked} 
                y={V} 
                r={6} 
                fill={SIMULATION_CHART_CONFIG.currentKLineColor} 
                stroke="white" 
                strokeWidth={2}
                label={{ position: 'right', value: `V = ${V.toFixed(1)} km/h`, fill: SIMULATION_CHART_CONFIG.currentKLineColor, fontWeight: 'bold' }}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
        
        <p className="text-xs text-muted-foreground mt-4 text-center">
          Based on reference density K = {K} veh/km. Adjust the density slider to see how gridlock threshold shifts.
        </p>
      </CardContent>
    </Card>
  );
}
