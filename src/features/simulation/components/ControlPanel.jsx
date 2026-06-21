import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useSimulationStore } from '../useSimulationStore';
import { useSimulationDerived } from '../useSimulationHooks';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { GridlockAlert } from './GridlockAlert';
import { MODEL_CONSTANTS } from '../modelEngine';

export function ControlPanel() {
  const { W_total, PCU_parked, K, setWTotal, setPCUParked, setK } = useSimulationStore();
  const derived = useSimulationDerived(W_total, PCU_parked, K);
  
  const handleWTotalChange = (val) => setWTotal(Array.isArray(val) ? val[0] : val);
  const handlePCUChange = (val) => setPCUParked(Array.isArray(val) ? val[0] : val);
  const handleKChange = (val) => setK(Array.isArray(val) ? val[0] : val);

  // Handle Input blur/enter for clamping
  const handleInputBlur = (e, setter) => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val)) setter(val);
  };

  const handleKeyDown = (e, setter) => {
    if (e.key === 'Enter') {
      const val = parseFloat(e.target.value);
      if (!isNaN(val)) setter(val);
    }
  };

  // Determine colors for metric cards
  let speedColor = 'green';
  if (derived.V < 20) speedColor = 'red';
  else if (derived.V <= 40) speedColor = 'amber';

  let widthColor = 'green';
  if (derived.W_eff < 3.6) widthColor = 'red';
  else if (derived.W_eff <= 7.0) widthColor = 'amber';

  let capacityColor = 'green';
  if (derived.capacityReduction > 50) capacityColor = 'red';
  else if (derived.capacityReduction >= 20) capacityColor = 'amber';

  return (
    <Card className="w-full">
      <CardContent className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Half: Sliders */}
        <div className="flex flex-col space-y-8">
          
          {/* Slider 1: W_total */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <label className="text-sm font-semibold flex items-center gap-2">
                  Road Width <Badge variant="secondary">m</Badge>
                </label>
                <p className="text-xs text-muted-foreground mt-1">Total physical usable width of the road segment</p>
              </div>
              <Input 
                key={`w-${W_total}`}
                type="number" 
                defaultValue={isNaN(W_total) ? 0 : W_total} 
                onBlur={(e) => handleInputBlur(e, setWTotal)}
                onKeyDown={(e) => handleKeyDown(e, setWTotal)}
                className="w-20 text-right" 
              />
            </div>
            <Slider 
              min={MODEL_CONSTANTS.W_MIN} 
              max={MODEL_CONSTANTS.W_MAX} 
              step={0.1} 
              value={[isNaN(W_total) ? 0 : W_total]} 
              onValueChange={handleWTotalChange} 
            />
            {W_total < 3.6 && (
              <p className="text-xs text-red-500 font-medium">Width below typical single-lane minimum</p>
            )}
          </div>

          {/* Slider 2: PCU_parked */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <label className="text-sm font-semibold flex items-center gap-2">
                  Parked Blockage <Badge variant="secondary">PCU</Badge>
                </label>
                <p className="text-xs text-muted-foreground mt-1">PCU equivalent of vehicles parked and obstructing the carriageway</p>
              </div>
              <Input 
                key={`pcu-${PCU_parked}`}
                type="number" 
                defaultValue={isNaN(PCU_parked) ? 0 : PCU_parked} 
                onBlur={(e) => handleInputBlur(e, setPCUParked)}
                onKeyDown={(e) => handleKeyDown(e, setPCUParked)}
                className="w-20 text-right" 
              />
            </div>
            <Slider 
              min={0} 
              max={derived.maxPCU || 0.1} 
              step={0.1} 
              value={[isNaN(PCU_parked) ? 0 : PCU_parked]} 
              onValueChange={handlePCUChange} 
            />
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">
                Blocks {derived.blockedWidth.toFixed(1)} m of {W_total.toFixed(1)} m road width
              </span>
            </div>
            {derived.isNearMinWidth && (
              <p className="text-xs text-amber-500 font-medium">Approaching minimum passable width</p>
            )}
          </div>

          {/* Slider 3: K */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <label className="text-sm font-semibold flex items-center gap-2">
                  Traffic Density <Badge variant="secondary">veh/km</Badge>
                </label>
                <p className="text-xs text-muted-foreground mt-1">Current number of vehicles per kilometre on the segment</p>
              </div>
              <Input 
                key={`k-${K}`}
                type="number" 
                defaultValue={isNaN(K) ? 0 : K} 
                onBlur={(e) => handleInputBlur(e, setK)}
                onKeyDown={(e) => handleKeyDown(e, setK)}
                className="w-20 text-right" 
              />
            </div>
            <Slider 
              min={MODEL_CONSTANTS.K_MIN} 
              max={MODEL_CONSTANTS.K_MAX} 
              step={1} 
              value={[isNaN(K) ? 0 : K]} 
              onValueChange={handleKChange} 
            />
            <div className="text-xs mt-1">
              <span className={K >= derived.K_j_eff ? "text-red-500 font-bold" : "text-muted-foreground"}>
                Gridlock threshold: {derived.K_j_eff.toFixed(1)} veh/km
              </span>
            </div>
          </div>
        </div>

        {/* Right Half: Metric Cards Grid */}
        <div className="grid grid-cols-2 grid-rows-2 gap-4">
          {derived.isGridlocked ? (
            <div className="col-span-2 row-span-2">
              <GridlockAlert K={K} K_j_eff={derived.K_j_eff} />
            </div>
          ) : (
            <>
              {/* Card 1: Predicted Speed */}
              <div className="col-span-1 row-span-1">
                <MetricCard 
                  label="Predicted Speed" 
                  value={derived.V} 
                  unit="km/h" 
                  color={speedColor}
                  subtext={`Free-flow: ${MODEL_CONSTANTS.V_F} km/h`}
                />
              </div>

              {/* Card 2: Effective Road Width */}
              <div className="col-span-1 row-span-1">
                <MetricCard 
                  label="Effective Width" 
                  value={derived.W_eff} 
                  unit="m" 
                  color={widthColor}
                  subtext={`${derived.effectiveLanes.toFixed(1)} effective lanes`}
                >
                   {/* Custom children to show warning badge if at floor limit */}
                   <div className={`text-3xl font-bold tracking-tight transition-colors duration-300 ${
                     widthColor === 'green' ? 'text-green-500' : widthColor === 'red' ? 'text-red-500' : 'text-amber-500'
                   }`}>
                     {derived.W_eff.toFixed(2)}
                     <span className="text-lg font-normal ml-1 text-muted-foreground">m</span>
                   </div>
                   <div className="flex items-center gap-2 mt-1">
                     <p className="text-sm text-muted-foreground">{derived.effectiveLanes.toFixed(1)} effective lanes</p>
                     {derived.W_eff <= MODEL_CONSTANTS.MIN_W_EFF + 0.01 && (
                       <Badge variant="destructive" className="text-[10px] px-1 py-0 h-4">At floor limit</Badge>
                     )}
                   </div>
                </MetricCard>
              </div>

              {/* Card 3: Jam Density */}
              <div className="col-span-1 row-span-1">
                <MetricCard 
                  label="Jam Density (K_j,eff)" 
                  value={derived.K_j_eff} 
                  unit="veh/km" 
                  color={capacityColor}
                  subtext={`Baseline: ${derived.K_j_base.toFixed(1)} veh/km`}
                />
              </div>

              {/* Card 4: Capacity Reduction */}
              <div className="col-span-1 row-span-1">
                {derived.capacityReduction === 0 ? (
                  <MetricCard 
                    label="Capacity Lost" 
                    value={0}
                  >
                    <div className="text-3xl font-bold tracking-tight text-muted-foreground/50">
                      0.0 <span className="text-lg font-normal ml-1">%</span>
                    </div>
                    <p className="text-sm text-muted-foreground/50 mt-1">no violations</p>
                  </MetricCard>
                ) : (
                  <MetricCard 
                    label="Capacity Lost" 
                    value={derived.capacityReduction} 
                    unit="%" 
                    color={capacityColor}
                    subtext={`${(derived.K_j_base - derived.K_j_eff).toFixed(1)} veh/km reduction`}
                  />
                )}
              </div>
            </>
          )}
        </div>

      </CardContent>
    </Card>
  );
}
