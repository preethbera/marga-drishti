import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine, ReferenceDot } from 'recharts';
import { CustomChartTooltip } from '@/components/ui/recharts-tooltip';
import { useSimulationStore } from '@/store/useSimulationStore';
import { calculatePredictedSpeed, calculateEffectiveJamDensity, calculateEffectiveWidth, V_F, V_O } from '@/core/engine/simulation';
import Latex from "react-latex-next";
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

const PCU_LEVELS = [0, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0];
const COLORS = {
  0: 'var(--color-chart-1)', 
  0.5: 'var(--color-chart-2)',
  1.0: 'var(--color-chart-4)', 
  1.5: 'var(--color-chart-8)',
  2.0: 'var(--color-chart-5)',
  2.5: 'var(--color-chart-3)', 
  3.0: 'var(--color-chart-6)'
};

export default function DensitySpeedCurve() {
  const { roadWidth, parkedPCU, trafficDensity } = useSimulationStore();
  const [activeCurves, setActiveCurves] = useState([0, 1.0, 2.0, 3.0]);

  const toggleCurve = (pcu) => {
    if (pcu === 0) return; // Baseline cannot be toggled off
    if (pcu === parkedPCU) return; // Current cannot be toggled off
    setActiveCurves(prev => 
      prev.includes(pcu) ? prev.filter(p => p !== pcu) : [...prev, pcu]
    );
  };

  const chartData = useMemo(() => {
    const data = [];
    const baseJam = calculateEffectiveJamDensity(roadWidth);
    const maxK = Math.ceil(baseJam * 1.1) || 150; // Dynamic max density to plot

    // Ensure baseline and current are always in the list of curves to calculate
    const curvesToCalc = Array.from(new Set([...activeCurves, 0, parkedPCU])).sort();

    // Generate ~200 points for smoothness
    const step = Math.max(0.1, maxK / 200);
    for (let k = step; k <= maxK; k += step) {
      const point = { density: Number(k.toFixed(2)) };
      
      curvesToCalc.forEach(pcu => {
        const wEff = calculateEffectiveWidth(roadWidth, pcu);
        const kjEff = calculateEffectiveJamDensity(wEff);
        const speed = calculatePredictedSpeed(k, kjEff);
        
        if (k <= kjEff) {
          point[`pcu_${pcu}`] = Math.max(0, speed);
        } else if (k - 2 < kjEff) {
          // First point after gridlock density, pull it to 0 so the line touches the axis
          point[`pcu_${pcu}`] = 0;
        }
      });
      
      data.push(point);
    }
    return data;
  }, [roadWidth, parkedPCU, activeCurves]);

  const currentW_eff = calculateEffectiveWidth(roadWidth, parkedPCU);
  const isAllGridlock = currentW_eff <= 1.0;

  return (
    <Card className="border-sidebar-border bg-sidebar shadow-md h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <CardTitle className="text-lg">Density-Speed Curve Family</CardTitle>
          <div className="flex flex-wrap gap-2">
            <span className="text-xs text-muted-foreground self-center mr-1">Toggle Curves (PCU):</span>
            {PCU_LEVELS.map(pcu => {
              const isBaseline = pcu === 0;
              const isCurrent = pcu === parkedPCU;
              const isActive = activeCurves.includes(pcu) || isBaseline || isCurrent;
              
              return (
                <Badge 
                  key={pcu}
                  variant={isActive ? "default" : "outline"}
                  className={`cursor-pointer transition-colors ${
                    isActive ? '' : 'text-muted-foreground'
                  } ${(isBaseline || isCurrent) ? 'pointer-events-none ring-2 ring-primary/50' : ''}`}
                  onClick={() => toggleCurve(pcu)}
                  style={{
                    backgroundColor: isActive ? COLORS[pcu] || '#8884d8' : 'transparent',
                    color: isActive ? '#fff' : undefined,
                    borderColor: COLORS[pcu] || '#8884d8'
                  }}
                >
                  {pcu.toFixed(1)} {isCurrent ? '(Current)' : ''}
                </Badge>
              )
            })}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 relative min-h-[300px]">
        {isAllGridlock ? (
          <div className="absolute inset-0 flex items-center justify-center p-6 z-10">
            <Alert variant="destructive" className="bg-red-950/80 border-red-900 shadow-xl max-w-md">
              <AlertTriangle className="h-5 w-5" />
              <AlertDescription>
                Road width is too narrow to support any flow. All configurations result in gridlock.
              </AlertDescription>
            </Alert>
          </div>
        ) : null}
        
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 30, right: 30, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis 
              dataKey="density" 
              type="number"
              domain={[0, Math.ceil(calculateEffectiveJamDensity(roadWidth) * 1.1) || 150]}
              stroke="#888" 
              fontSize={12}
              tickLine={false}
              axisLine={true}
              label={{ value: 'Traffic Density (veh/km)', position: 'insideBottom', offset: -5, fill: '#888', fontSize: 13 }}
            />
            <YAxis 
              stroke="#888" 
              fontSize={12}
              domain={[0, V_F + 1.1]}
              tickLine={false}
              axisLine={true}
              label={{ value: 'Predicted Speed (km/h)', angle: -90, position: 'insideBottom', offset: 110, fill: '#888', fontSize: 13 }}
            />
            <Tooltip 
              content={<CustomChartTooltip />} 
              formatter={(value, name) => {
                // If the speed exceeds our physical bounds by a lot (Greenberg singularity), show infinity symbol or theoretical cap
                const displaySpeed = value > V_F + 10 ? '∞' : value.toFixed(1);
                return [`${displaySpeed} km/h`, `PCU Level: ${name.split('_')[1]}`];
              }}
              labelFormatter={(label) => `Density: ${label} veh/km`}
            />
            
            {/* Free Flow and Optimum Reference Lines */}
            <ReferenceLine y={V_F} stroke="#64748b" strokeDasharray="3 3" label={{ position: 'insideTopRight', value: `Free-Flow (${V_F.toFixed(0)} km/h)`, fill: '#94a3b8', fontSize: 12 }} />
            <ReferenceLine y={V_O} stroke="#64748b" strokeDasharray="3 3" label={{ position: 'insideBottomRight', value: `Optimum (${V_O.toFixed(1)} km/h)`, fill: '#94a3b8', fontSize: 12 }} />

            {/* Draw Reference Line for current density */}
            {trafficDensity > 0 && trafficDensity <= 150 && (
              <ReferenceLine 
                x={trafficDensity} 
                stroke="#f97316" 
                label={{ position: 'top', value: 'Current K', fill: '#f97316', fontSize: 12 }}
              />
            )}
            
            {/* Draw Reference Dot for current speed */}
            {trafficDensity > 0 && trafficDensity <= 150 && (
              <ReferenceDot 
                x={trafficDensity} 
                y={calculatePredictedSpeed(trafficDensity, calculateEffectiveJamDensity(calculateEffectiveWidth(roadWidth, parkedPCU)))} 
                r={6} 
                fill="#fff" 
                stroke={COLORS[parkedPCU] || 'var(--color-chart-1)'} 
                strokeWidth={3} 
                label={{ position: 'right', value: `V = ${Math.max(0, calculatePredictedSpeed(trafficDensity, calculateEffectiveJamDensity(calculateEffectiveWidth(roadWidth, parkedPCU)))).toFixed(1)} km/h`, fill: COLORS[parkedPCU] || 'var(--color-chart-1)', fontSize: 14, fontWeight: 'bold' }}
              />
            )}

            {/* <Legend 
              verticalAlign="top" 
              align="right"
              layout="vertical"
              wrapperStyle={{ paddingLeft: '20px', paddingTop: '10px' }}
              formatter={(value, entry) => {
                const pcu = parseFloat(value.split('_')[1]);
                const isCurrent = pcu === parkedPCU;
                const isBaseline = pcu === 0;
                let label = `PCU ${pcu.toFixed(1)}`;
                if (isCurrent) label += ' (active)';
                if (isBaseline) label += ' (Baseline)';
                return <span style={{ color: entry.color, fontSize: '12px' }}>{label}</span>;
              }}
            /> */}

            {Array.from(new Set([...activeCurves, 0, parkedPCU])).sort().map(pcu => (
              <Line 
                key={`pcu_${pcu}`}
                type="monotone" 
                dataKey={`pcu_${pcu}`} 
                name={`pcu_${pcu}`}
                stroke={COLORS[pcu] || 'var(--color-chart-1)'} 
                strokeWidth={pcu === parkedPCU ? 2 : 1}
                strokeDasharray={pcu === parkedPCU ? "0" : "5 5"}
                dot={false}
                activeDot={{ r: 6 }}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
