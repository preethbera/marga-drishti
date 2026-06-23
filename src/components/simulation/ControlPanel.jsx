import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Info } from 'lucide-react';
import { useSimulationStore } from '@/store/useSimulationStore';
import { BlockMath, InlineMath } from 'react-katex';

export default function ControlPanel() {
  const { 
    roadWidth, 
    parkedPCU, 
    trafficDensity, 
    results, 
    setInputs 
  } = useSimulationStore();

  const {
    V,
    W_eff,
    K_j_base,
    K_j_eff,
    capacityLostPercent,
    isGridlocked,
    maxPCU,
    gridlockPCU
  } = results;

  // Handlers for sliders and inputs
  const handleWidthChange = (val) => setInputs({ roadWidth: parseFloat(val) || 0 });
  const handlePCUChange = (val) => setInputs({ parkedPCU: parseFloat(val) || 0 });
  const handleDensityChange = (val) => setInputs({ trafficDensity: parseFloat(val) || 0 });

  // Formatting helpers
  const formatNumber = (num) => isNaN(num) ? "0.0" : num.toFixed(1);

  // Speed Badge Color
  let speedColor = "bg-green-500/10 text-green-500 hover:bg-green-500/20";
  if (V < 20) speedColor = "bg-red-500/10 text-red-500 hover:bg-red-500/20";
  else if (V <= 40) speedColor = "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20";

  // Width Badge Color
  let widthColor = "bg-green-500/10 text-green-500 hover:bg-green-500/20";
  if (W_eff < 3.6) widthColor = "bg-red-500/10 text-red-500 hover:bg-red-500/20";
  else if (W_eff <= 7.2) widthColor = "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
      {/* Inputs Section */}
      <Card className="border-sidebar-border bg-sidebar shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Control Parameters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Road Width */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label className="flex items-center gap-2">
                Road Width <InlineMath math="(W_{total})" />
              </Label>
              <div className="flex items-center gap-2 w-24">
                <Input 
                  type="number" 
                  value={roadWidth} 
                  onChange={(e) => handleWidthChange(e.target.value)}
                  className="h-8 text-right"
                  min={3.0} max={20.0} step={0.1}
                />
                <span className="text-sm text-muted-foreground">m</span>
              </div>
            </div>
            <Slider 
              value={[roadWidth]} 
              min={3.0} max={20.0} step={0.1}
              onValueChange={(val) => handleWidthChange(Array.isArray(val) ? val[0] : val)}
            />
            {roadWidth < 3.6 && (
              <p className="text-xs text-amber-500 flex items-center mt-1">
                <AlertTriangle className="h-3 w-3 mr-1" /> Width below typical single-lane minimum.
              </p>
            )}
          </div>

          {/* Parked Blockage */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label className="flex items-center gap-2">
                Parked Blockage <InlineMath math="(PCU_{parked})" />
              </Label>
              <div className="flex items-center gap-2 w-24">
                <Input 
                  type="number" 
                  value={parkedPCU} 
                  onChange={(e) => handlePCUChange(e.target.value)}
                  className="h-8 text-right"
                  min={0} max={Math.ceil(maxPCU)} step={0.1}
                />
                <span className="text-sm text-muted-foreground">pcu</span>
              </div>
            </div>
            <Slider 
              value={[Math.min(parkedPCU, maxPCU)]} 
              min={0} max={maxPCU > 0 ? maxPCU : 0.1} step={0.1}
              onValueChange={(val) => handlePCUChange(Array.isArray(val) ? val[0] : val)}
            />
            <p className="text-xs text-muted-foreground">
              Blocks {(parkedPCU * 3.0).toFixed(1)}m of road. Max allowed: {maxPCU.toFixed(1)} PCU.
            </p>
            {W_eff <= 1.0 && (
              <p className="text-xs text-red-500 flex items-center mt-1">
                <AlertTriangle className="h-3 w-3 mr-1" /> Approaching minimum passable width!
              </p>
            )}
          </div>

          {/* Traffic Density */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label className="flex items-center gap-2">
                Traffic Density <InlineMath math="(K)" />
              </Label>
              <div className="flex items-center gap-2 w-24">
                <Input 
                  type="number" 
                  value={trafficDensity} 
                  onChange={(e) => handleDensityChange(e.target.value)}
                  className="h-8 text-right"
                  min={1} max={150} step={1}
                />
                <span className="text-sm text-muted-foreground">v/km</span>
              </div>
            </div>
            <Slider 
              value={[trafficDensity]} 
              min={1} max={150} step={1}
              onValueChange={(val) => handleDensityChange(Array.isArray(val) ? val[0] : val)}
            />
            <p className="text-xs text-muted-foreground">
              Gridlock threshold at current PCU: {K_j_eff.toFixed(1)} veh/km.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* KPI Section */}
      <div className="flex flex-col gap-4 h-full">
        {isGridlocked ? (
          <Alert variant="destructive" className="h-full flex flex-col items-center justify-center bg-red-950/40 border-red-900/50">
            <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
            <AlertTitle className="text-2xl font-bold text-red-500">System Gridlock</AlertTitle>
            <AlertDescription className="text-center text-red-200 mt-2 max-w-sm">
              The combination of traffic density and parked vehicles has exceeded the physical capacity of the road. Flow is completely halted (<InlineMath math="V = 0" />).
            </AlertDescription>
          </Alert>
        ) : (
          <div className="grid grid-cols-2 gap-4 h-full">
            <Card className="border-sidebar-border bg-sidebar/50 shadow-sm flex flex-col justify-center relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-transparent to-background/20 pointer-events-none" />
              <CardContent className="p-4 relative z-10">
                <p className="text-sm text-muted-foreground mb-1">Predicted Speed</p>
                <div className="flex items-end gap-2">
                  <span className="text-3xl font-bold tabular-nums tracking-tighter">{formatNumber(V)}</span>
                  <span className="text-sm text-muted-foreground mb-1">km/h</span>
                </div>
                <Badge variant="secondary" className={`mt-2 ${speedColor}`}>
                  <InlineMath math="V" />
                </Badge>
              </CardContent>
            </Card>

            <Card className="border-sidebar-border bg-sidebar/50 shadow-sm flex flex-col justify-center relative overflow-hidden">
              <CardContent className="p-4 relative z-10">
                <p className="text-sm text-muted-foreground mb-1">Effective Width</p>
                <div className="flex items-end gap-2">
                  <span className="text-3xl font-bold tabular-nums tracking-tighter">{formatNumber(W_eff)}</span>
                  <span className="text-sm text-muted-foreground mb-1">m</span>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="secondary" className={widthColor}>
                    <InlineMath math="W_{eff}" />
                  </Badge>
                  {W_eff <= 1.0 && <Badge variant="destructive" className="text-[10px]">FLOOR LIMIT</Badge>}
                </div>
              </CardContent>
            </Card>

            <Card className="border-sidebar-border bg-sidebar/50 shadow-sm flex flex-col justify-center relative overflow-hidden">
              <CardContent className="p-4 relative z-10">
                <p className="text-sm text-muted-foreground mb-1">Jam Density</p>
                <div className="flex items-end gap-2">
                  <span className="text-3xl font-bold tabular-nums tracking-tighter">{formatNumber(K_j_eff)}</span>
                  <span className="text-sm text-muted-foreground mb-1">veh/km</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Base <InlineMath math="K_{j}" />: {formatNumber(K_j_base)}
                </p>
              </CardContent>
            </Card>

            <Card className="border-sidebar-border bg-sidebar/50 shadow-sm flex flex-col justify-center relative overflow-hidden">
              <CardContent className="p-4 relative z-10">
                <p className="text-sm text-muted-foreground mb-1">Capacity Lost</p>
                <div className="flex items-end gap-2">
                  <span className="text-3xl font-bold tabular-nums tracking-tighter text-amber-500">{formatNumber(capacityLostPercent)}</span>
                  <span className="text-sm text-amber-500 mb-1">%</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  -{formatNumber(K_j_base - K_j_eff)} veh/km
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
