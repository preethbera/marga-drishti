import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useSimulationStore } from '../useSimulationStore';
import { useSimulationDerived } from '../useSimulationHooks';
import { SIMULATION_CHART_CONFIG } from '../simulationConfig';
import { MODEL_CONSTANTS } from '../modelEngine';

export function RoadCrossSection() {
  const { W_total, PCU_parked, K } = useSimulationStore();
  const derived = useSimulationDerived(W_total, PCU_parked, K);
  const { W_eff, blockedWidth, effectiveLanes } = derived;

  let blockedPct = W_total ? (blockedWidth / W_total) : 0;
  if (isNaN(blockedPct)) blockedPct = 0;
  blockedPct = Math.min(Math.max(blockedPct, 0), 1);
  const usablePct = 1 - blockedPct;

  const isSubLane = W_total < 3.6;
  let usableColor = SIMULATION_CHART_CONFIG.crossSection.usableColor;
  if (isSubLane || W_eff < 3.6) usableColor = SIMULATION_CHART_CONFIG.crossSection.warningColor; // amber or red logic from prompt
  if (W_eff < 3.6 && !isSubLane) usableColor = SIMULATION_CHART_CONFIG.crossSection.warningColor;
  
  // The prompt says: "usable section: green if W_eff >= 7.2 m, amber if 3.6-7.2 m, red/warning if < 3.6m"
  if (W_eff >= 7.2) {
    usableColor = SIMULATION_CHART_CONFIG.crossSection.usableColor; // green
  } else if (W_eff >= 3.6) {
    usableColor = SIMULATION_CHART_CONFIG.crossSection.warningColor; // amber
  } else {
    usableColor = SIMULATION_CHART_CONFIG.gridlock.color; // red
  }

  const isAtFloor = W_eff <= MODEL_CONSTANTS.MIN_W_EFF + 0.01;

  // Number of 3.6m lanes that fit
  const numLanes = Math.floor(W_total / 3.6);
  const laneLines = [];
  for (let i = 1; i <= numLanes; i++) {
    const lanePosMeters = i * 3.6;
    if (lanePosMeters >= W_total) break; // don't draw on the very edge
    const xPos = (lanePosMeters / W_total) * 600;
    laneLines.push(xPos);
  }

  return (
    <Card className="h-full flex flex-col justify-between">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Road Cross-Section</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-center p-6 space-y-6">
        
        <div className="flex justify-between items-end text-sm">
          <div>
            <p className="text-muted-foreground">Total width</p>
            <p className="font-bold text-lg">{W_total.toFixed(1)} m</p>
          </div>
          <div className="text-center">
            <p className="text-muted-foreground">Blocked ({ (blockedPct * 100).toFixed(0) }%)</p>
            <p className="font-bold text-lg text-red-500">{blockedWidth.toFixed(1)} m</p>
          </div>
          <div className="text-right">
            <p className="text-muted-foreground">Usable</p>
            <p className="font-bold text-lg" style={{ color: usableColor }}>{W_eff.toFixed(1)} m</p>
            <p className="text-xs text-muted-foreground">{effectiveLanes.toFixed(1)} effective lanes</p>
          </div>
        </div>

        <div className="w-full relative group">
          <svg viewBox="0 0 600 120" width="100%" className="overflow-visible">
            <defs>
              <pattern id="hatch" width="10" height="10" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                <line x1="0" y1="0" x2="0" y2="10" stroke="#ffffff" strokeWidth="3" opacity="0.4" />
              </pattern>
            </defs>

            {/* Background / Total road bed */}
            <rect x="0" y="20" width="600" height="60" fill="hsl(var(--muted))" rx="4" />

            {/* Blocked Section (Left side) */}
            {blockedPct > 0 && (
              <g className="transition-all duration-300 ease-in-out">
                <rect 
                  x="0" 
                  y="20" 
                  width={blockedPct * 600} 
                  height="60" 
                  fill={SIMULATION_CHART_CONFIG.crossSection.parkedColor} 
                  rx="4"
                  opacity="0.85"
                  className="transition-all duration-300 ease-in-out"
                />
                <rect 
                  x="0" 
                  y="20" 
                  width={blockedPct * 600} 
                  height="60" 
                  fill="url(#hatch)" 
                  rx="4"
                  className="transition-all duration-300 ease-in-out"
                />
              </g>
            )}

            {/* Usable Section (Right side) */}
            <rect 
              x={blockedPct * 600} 
              y="20" 
              width={usablePct * 600} 
              height="60" 
              fill={usableColor} 
              rx="4"
              className="transition-all duration-300 ease-in-out"
              opacity="0.9"
            />
            {isAtFloor && (
              <rect 
                x={blockedPct * 600} 
                y="18" 
                width={usablePct * 600} 
                height="64" 
                fill="none" 
                stroke="red" 
                strokeWidth="2" 
                rx="4"
                className="transition-all duration-300 ease-in-out"
              />
            )}

            {/* Lane Lines */}
            {laneLines.map(x => (
              <line 
                key={x} 
                x1={x} 
                y1="20" 
                x2={x} 
                y2="80" 
                stroke={SIMULATION_CHART_CONFIG.crossSection.laneLineColor} 
                strokeWidth="2" 
                strokeDasharray="10 6" 
                opacity="0.6"
              />
            ))}

            {/* Warning Overlay */}
            {isSubLane && (
              <text x="300" y="55" textAnchor="middle" fill="#fff" fontSize="14" fontWeight="bold" opacity="0.9">
                Sub-lane-width road
              </text>
            )}

            {isAtFloor && !isSubLane && (
              <text x={blockedPct * 600 + (usablePct * 600) / 2} y="55" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="bold">
                MIN PASSABLE
              </text>
            )}

            {/* Dimension Arrows */}
            <g opacity="0.7">
              {/* Blocked width arrow */}
              {blockedPct > 0.05 && (
                <>
                  <line x1="5" y1="100" x2={blockedPct * 600 - 5} y2="100" stroke="currentColor" strokeWidth="1" markerEnd="url(#arrow)" markerStart="url(#arrow)" />
                  <text x={(blockedPct * 600) / 2} y="115" textAnchor="middle" fontSize="12" fill="currentColor">
                    {blockedWidth.toFixed(1)}m blocked
                  </text>
                </>
              )}
              
              {/* Usable width arrow */}
              {usablePct > 0.1 && (
                <>
                  <line x1={blockedPct * 600 + 5} y1="100" x2="595" y2="100" stroke="currentColor" strokeWidth="1" markerEnd="url(#arrow)" markerStart="url(#arrow)" />
                  <text x={blockedPct * 600 + (usablePct * 600) / 2} y="115" textAnchor="middle" fontSize="12" fill="currentColor">
                    {W_eff.toFixed(1)}m usable
                  </text>
                </>
              )}
            </g>

            <defs>
              <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" />
              </marker>
            </defs>
          </svg>
        </div>

      </CardContent>
    </Card>
  );
}
