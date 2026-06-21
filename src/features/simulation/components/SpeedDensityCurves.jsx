import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine, ReferenceDot, ResponsiveContainer } from 'recharts';
import { useSimulationStore } from '../useSimulationStore';
import { useSimulationDerived, useSpeedDensityCurves } from '../useSimulationHooks';
import { SIMULATION_CHART_CONFIG } from '../simulationConfig';
import { MODEL_CONSTANTS } from '../modelEngine';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-background border border-border p-3 rounded shadow-md text-sm">
        <p className="font-semibold mb-1">PCU Level: {data.pcu !== undefined ? data.pcu.toFixed(1) : payload[0].name.replace('PCU ', '')} PCU</p>
        <p>Density: {data.K.toFixed(1)} veh/km</p>
        <p>Speed: {data.V.toFixed(1)} km/h</p>
      </div>
    );
  }
  return null;
};

export function SpeedDensityCurves() {
  const { W_total, PCU_parked, K, curvePCULevels, addCurvePCULevel, removeCurvePCULevel } = useSimulationStore();
  const derived = useSimulationDerived(W_total, PCU_parked, K);
  const curvesData = useSpeedDensityCurves(W_total, PCU_parked, curvePCULevels);

  const allFlat = curvesData.every(c => c.points.length === 1 && c.points[0].V === 0);

  const handleTogglePCU = (level) => {
    if (curvePCULevels.includes(level)) {
      removeCurvePCULevel(level);
    } else {
      addCurvePCULevel(level);
    }
  };

  const availableToggles = [0, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0];

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Density-Speed Curve Family</CardTitle>
        <div className="flex gap-2 items-center flex-wrap">
          <span className="text-xs text-muted-foreground mr-2">Toggle PCU Curves:</span>
          {availableToggles.map(level => {
            const isActive = curvePCULevels.includes(level) || level === PCU_parked;
            const isLocked = level === 0 || level === PCU_parked;
            return (
              <Badge 
                key={level}
                variant={isActive ? "default" : "outline"}
                className={`cursor-pointer ${isLocked ? 'opacity-70 cursor-not-allowed' : ''}`}
                onClick={() => !isLocked && handleTogglePCU(level)}
              >
                {level.toFixed(1)}
              </Badge>
            );
          })}
        </div>
      </CardHeader>
      <CardContent className="flex-1 relative min-h-[300px]">
        {allFlat ? (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10 text-center p-6">
            <p className="text-lg font-medium text-red-500">
              All configurations result in gridlock. <br/>
              <span className="text-sm text-muted-foreground">Adjust road width or reduce blockage.</span>
            </p>
          </div>
        ) : null}
        
        <ResponsiveContainer width="100%" height="100%">
          <LineChart margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis 
              dataKey="K" 
              type="number"
              domain={[0, Math.max(derived.K_j_base * 1.1, MODEL_CONSTANTS.K_MAX)]}
              label={{ value: SIMULATION_CHART_CONFIG.axes.KLabel, position: 'insideBottom', offset: -10 }}
              tickFormatter={(v) => `${v} veh/km`}
              allowDataOverflow
            />
            <YAxis 
              dataKey="V"
              domain={[0, MODEL_CONSTANTS.V_F + 5]}
              label={{ value: SIMULATION_CHART_CONFIG.axes.VLabel, angle: -90, position: 'insideLeft' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend verticalAlign="bottom" height={36} wrapperStyle={{ paddingTop: '20px' }} />

            {/* Reference Lines */}
            <ReferenceLine y={MODEL_CONSTANTS.V_O} stroke={SIMULATION_CHART_CONFIG.referenceLineColor} strokeDasharray="5 5" label={{ position: 'top', value: `Optimum (${MODEL_CONSTANTS.V_O} km/h)`, fill: SIMULATION_CHART_CONFIG.referenceLineColor, fontSize: 12 }} />
            <ReferenceLine y={MODEL_CONSTANTS.V_F} stroke={SIMULATION_CHART_CONFIG.referenceLineColor} strokeDasharray="3 3" label={{ position: 'top', value: `Free-Flow (${MODEL_CONSTANTS.V_F} km/h)`, fill: SIMULATION_CHART_CONFIG.referenceLineColor, fontSize: 12 }} />
            <ReferenceLine x={K} stroke={derived.isGridlocked ? SIMULATION_CHART_CONFIG.gridlock.color : SIMULATION_CHART_CONFIG.currentKLineColor} label={{ position: 'insideTopLeft', value: 'Current K', fill: derived.isGridlocked ? SIMULATION_CHART_CONFIG.gridlock.color : SIMULATION_CHART_CONFIG.currentKLineColor, fontSize: 12 }} />

            {/* Curves */}
            {curvesData.map((curve, idx) => {
              const color = SIMULATION_CHART_CONFIG.curveColors[idx % SIMULATION_CHART_CONFIG.curveColors.length];
              const name = `PCU ${curve.pcu.toFixed(1)}${curve.isCurrent ? ' (active)' : ''}${curve.pcu === 0 ? ' (Baseline)' : ''}`;
              return (
                <Line
                  key={curve.pcu}
                  data={curve.points}
                  type="monotone"
                  dataKey="V"
                  name={name}
                  stroke={curve.isCurrent ? SIMULATION_CHART_CONFIG.currentCurveColor : color}
                  strokeWidth={curve.isCurrent ? SIMULATION_CHART_CONFIG.currentCurveWidth : SIMULATION_CHART_CONFIG.defaultCurveWidth}
                  strokeDasharray={curve.isCurrent ? "0" : "4 2"}
                  dot={false}
                  isAnimationActive={false}
                />
              );
            })}

            {/* Current State Dot */}
            <ReferenceDot 
              x={derived.isGridlocked ? derived.K_j_eff : K} 
              y={derived.V} 
              r={6} 
              fill={SIMULATION_CHART_CONFIG.currentCurveColor} 
              stroke="white" 
              strokeWidth={2}
              label={{ position: 'right', value: `V = ${derived.V.toFixed(1)} km/h`, fill: SIMULATION_CHART_CONFIG.currentCurveColor, fontWeight: 'bold' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
