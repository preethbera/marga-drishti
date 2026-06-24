import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
  ReferenceLine,
  ReferenceDot,
} from "recharts";
import { CustomChartTooltip } from "@/components/ui/recharts-tooltip";
import { useSimulationStore } from "@/store/useSimulationStore";
import {
  calculateEffectiveWidth,
  calculateEffectiveJamDensity,
  calculatePredictedSpeed,
  calculateMaxPCU,
  calculateGridlockPCU,
  V_F,
  V_O,
} from "@/core/engine/simulation";
import Latex from "react-latex-next";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

export default function SensitivitySweep() {
  const { roadWidth, trafficDensity, parkedPCU } = useSimulationStore();

  const maxPCU = calculateMaxPCU(roadWidth);
  const gridlockPCU = calculateGridlockPCU(roadWidth, trafficDensity);

  const chartData = useMemo(() => {
    const data = [];
    const step = maxPCU > 0 ? maxPCU / 200 : 0.05;

    for (let pcu = 0; pcu <= maxPCU; pcu += step) {
      const wEff = calculateEffectiveWidth(roadWidth, pcu);
      const kjEff = calculateEffectiveJamDensity(wEff);
      const speed = calculatePredictedSpeed(trafficDensity, kjEff);

      data.push({
        pcu: Number(pcu.toFixed(2)),
        speed: speed < 0 ? 0 : speed,
      });

      // Stop generating data points once we hit gridlock to prevent cursor from moving further
      if (speed <= 0) {
        // Ensure we end exactly at gridlock PCU
        if (pcu !== gridlockPCU) {
          data.push({ pcu: Number(gridlockPCU.toFixed(2)), speed: 0 });
        }
        break;
      }
    }

    return data.sort((a, b) => a.pcu - b.pcu);
  }, [roadWidth, trafficDensity, maxPCU, gridlockPCU]);

  const isGridlockAtZero = gridlockPCU <= 0;
  const isWidthMinimum = roadWidth <= 1.0;
  const currentSpeed = calculatePredictedSpeed(
    trafficDensity,
    calculateEffectiveJamDensity(calculateEffectiveWidth(roadWidth, parkedPCU)),
  );

  return (
    <Card className="border-sidebar-border bg-sidebar shadow-md h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <CardTitle className="text-lg">
            Sensitivity Sweep: Speed vs. Parked PCU
          </CardTitle>
          <span className="text-sm text-muted-foreground">
            Reference <Latex>{String.raw`$K$`}</Latex>:{" "}
            <span className="font-mono">{trafficDensity.toFixed(1)}</span>{" "}
            veh/km
          </span>
        </div>
      </CardHeader>
      <CardContent className="flex-1 relative min-h-[300px]">
        {isWidthMinimum ? (
          <div className="absolute inset-0 flex items-center justify-center p-6 z-10">
            <Alert
              variant="destructive"
              className="bg-red-950/80 border-red-900 shadow-xl max-w-md"
            >
              <AlertTriangle className="h-5 w-5" />
              <AlertDescription>
                Road width is at absolute minimum. Cannot add parked vehicles.
              </AlertDescription>
            </Alert>
          </div>
        ) : isGridlockAtZero ? (
          <div className="absolute inset-0 flex items-center justify-center p-6 z-10 pointer-events-none">
            <Alert
              variant="destructive"
              className="bg-red-950/80 border-red-900 shadow-xl max-w-md"
            >
              <AlertTriangle className="h-5 w-5" />
              <AlertDescription>
                Traffic density alone causes total traffic jam. Any parking will
                only worsen the situation.
              </AlertDescription>
            </Alert>
          </div>
        ) : null}

        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 0, bottom: 25 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#333"
              vertical={false}
            />
            <XAxis
              dataKey="pcu"
              type="number"
              domain={[
                0,
                Math.min(maxPCU, gridlockPCU > 0 ? gridlockPCU * 1.5 : 10),
              ]}
              stroke="#888"
              fontSize={12}
              tickLine={false}
              axisLine={true}
              allowDataOverflow
              label={{
                value: "Parked Blockage (PCU)",
                position: "insideBottom",
                offset: -5,
                fill: "#888",
                fontSize: 13,
              }}
            />
            <YAxis
              stroke="#888"
              fontSize={12}
              domain={[0, V_F + 2]}
              tickLine={false}
              axisLine={false}
              label={{
                value: "Predicted Speed (km/h)",
                angle: -90,
                position: "insideBottom",
                offset: 110,
                fill: "#888",
                fontSize: 13,
              }}
            />
            <Tooltip
              content={<CustomChartTooltip />}
              formatter={(value) => {
                if (value <= gridlockPCU)
                  return [`0.0 km/h (Jammed)`, `Predicted Speed`];
                return [`${value.toFixed(1)} km/h`, `Predicted Speed`];
              }}
              labelFormatter={(label) => `Blockage: ${label} PCU`}
            />

            <ReferenceLine
              y={currentSpeed}
              stroke="#64748b"
              strokeDasharray="3 3"
              label={{
                position: "insideTopRight",
                value: "Optimum Speed",
                fill: "#94a3b8",
                fontSize: 12,
              }}
            />

            {gridlockPCU < maxPCU && gridlockPCU > 0 && (
              <>
                <ReferenceArea
                  x1={gridlockPCU}
                  x2={maxPCU}
                  fill="rgba(239, 68, 68, 0.1)"
                  strokeOpacity={0}
                />
                <ReferenceLine
                  x={gridlockPCU}
                  stroke="#ef4444"
                  strokeDasharray="3 3"
                  label={{
                    position: "top",
                    value: `Jam at ${gridlockPCU.toFixed(1)} PCU`,
                    fill: "#ef4444",
                    fontSize: 12,
                  }}
                />
              </>
            )}

            {/* Current PCU Reference Line */}
            {parkedPCU <= maxPCU && (
              <ReferenceLine
                x={parkedPCU}
                stroke="#f97316"
                label={{
                  position: "top",
                  value: `Current: ${parkedPCU.toFixed(1)} PCU`,
                  fill: "#f97316",
                  fontSize: 12,
                }}
              />
            )}

            {parkedPCU <= maxPCU && currentSpeed > 0 && (
              <ReferenceDot
                x={parkedPCU}
                y={currentSpeed}
                r={6}
                fill="#fff"
                stroke="#f97316"
                strokeWidth={3}
                label={{
                  position: "right",
                  value: `V = ${currentSpeed.toFixed(1)} km/h`,
                  fill: "#fb923c",
                  fontSize: 14,
                  fontWeight: "bold",
                }}
              />
            )}

            <Area
              type="monotone"
              dataKey="speed"
              stroke="#0ea5e9"
              fill="#0ea5e9"
              fillOpacity={0.2}
              strokeWidth={2}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>

        <p className="text-xs text-muted-foreground mt-4 text-center">
          Based on reference density K = {trafficDensity.toFixed(1)} veh/km.
          Adjust the density slider to see how jam threshold shifts.
        </p>
      </CardContent>
    </Card>
  );
}
