import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@components/ui/card';
import { Progress } from '@components/ui/progress';
import { SIMULATION_CHART_CONFIG } from '@features/simulation/simulationConfig';

export function GridlockGauge({
  K,
  K_j_eff,
  isGridlocked,
  arcColor,
  zoneLabel,
  fillRatio,
  strokeDasharray,
  strokeDashoffset,
  d
}) {
  const validKj = K_j_eff > 1;
  return (
    <Card className="h-full flex flex-col justify-between">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Gridlock Threshold</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col items-center justify-center p-6">
        
        <div className="w-full max-w-[200px] aspect-square relative">
          <svg viewBox="0 0 200 200" className="w-full h-full overflow-visible">
            {/* Background track */}
            <path 
              d={d}
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth="16"
              strokeLinecap="round"
            />
            {/* Foreground track */}
            <path 
              d={d}
              fill="none"
              stroke={arcColor}
              strokeWidth="16"
              strokeLinecap="round"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              className={`transition-all duration-500 ease-in-out ${isGridlocked ? 'animate-pulse' : ''}`}
            />

            {/* Tick marks */}
            {validKj && [0, 0.25, 0.5, 0.75, 1.0].map(tick => {
              // angle from 135 to 405 (135 + tick * 270)
              const angleDeg = 135 + tick * 270;
              const angleRad = (angleDeg * Math.PI) / 180;
              const x1 = 100 + 72 * Math.cos(angleRad);
              const y1 = 100 + 72 * Math.sin(angleRad);
              const x2 = 100 + 88 * Math.cos(angleRad);
              const y2 = 100 + 88 * Math.sin(angleRad);
              
              // Tick label position
              const tx = 100 + 105 * Math.cos(angleRad);
              const ty = 100 + 105 * Math.sin(angleRad) + 4; // slight y offset
              
              const val = (K_j_eff * tick).toFixed(0);

              return (
                <g key={tick}>
                  <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="currentColor" strokeWidth="2" opacity="0.3" />
                  <text x={tx} y={ty} textAnchor="middle" fontSize="10" fill="currentColor" opacity="0.6">
                    {val}
                  </text>
                </g>
              );
            })}

            {/* Center text */}
            <text x="100" y="85" textAnchor="middle" fontSize="12" fill="currentColor" opacity="0.6">
              K_j,eff = {validKj ? K_j_eff.toFixed(1) : "N/A"}
            </text>
            <text x="100" y="115" textAnchor="middle" fontSize="28" fontWeight="bold" fill="currentColor">
              {validKj ? K : "0"}
            </text>
            <text x="100" y="130" textAnchor="middle" fontSize="10" fill="currentColor" opacity="0.6">
              veh/km
            </text>
            
            <text x="100" y="150" textAnchor="middle" fontSize="12" fontWeight="bold" fill={isGridlocked || !validKj ? SIMULATION_CHART_CONFIG.gridlock.color : "currentColor"} className="transition-colors">
              {!validKj ? "CAPACITY ELIMINATED" : (isGridlocked ? "GRIDLOCKED" : `Margin: ${(K_j_eff - K).toFixed(1)}`)}
            </text>

            <text x="100" y="185" textAnchor="middle" fontSize="14" fontWeight="600" fill={arcColor}>
              {zoneLabel}
            </text>
          </svg>
        </div>

        <div className="w-full mt-6 space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Capacity Utilisation</span>
            <span className="font-medium text-foreground">{(fillRatio * 100).toFixed(0)}%</span>
          </div>
          <Progress value={fillRatio * 100} className="h-2" indicatorColor={arcColor} />
        </div>

      </CardContent>
    </Card>
  );
}
