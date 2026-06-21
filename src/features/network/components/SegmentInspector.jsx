import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { GridlockAlert } from '../../simulation/components/GridlockAlert';
import { useNetworkStore } from '../useNetworkStore';
import { useNetworkAggregate, useSegmentDetail } from '../useNetworkHooks';
import { SIMULATION_CHART_CONFIG } from '../../simulation/simulationConfig';
import { MODEL_CONSTANTS } from '../../simulation/modelEngine';
import { LineChart, Line, XAxis, YAxis, Tooltip, ReferenceDot, ReferenceLine, ResponsiveContainer } from 'recharts';

export function SegmentInspector() {
  const { data } = useNetworkAggregate();
  const { 
    selectedSegmentId, 
    referenceK, 
    setReferenceK,
    clearSelectedSegment,
    setCascadeOrigin
  } = useNetworkStore();

  const detail = useSegmentDetail(data, selectedSegmentId, referenceK);

  if (!selectedSegmentId) {
    return (
      <Card className="h-[600px] flex flex-col items-center justify-center text-center p-6 bg-muted/20">
        <p className="text-muted-foreground">Select a segment on the map or in the table to inspect it.</p>
      </Card>
    );
  }

  if (detail?.outOfScope) {
    return (
      <Card className="h-[600px] flex flex-col items-center justify-center text-center p-6 bg-muted/20">
        <p className="text-muted-foreground">This segment is outside the current filter scope.</p>
        <Button variant="outline" className="mt-4" onClick={clearSelectedSegment}>Clear Selection</Button>
      </Card>
    );
  }

  return (
    <Card className="h-[600px] flex flex-col overflow-y-auto">
      <CardHeader className="pb-3 border-b border-border sticky top-0 bg-background z-10">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">Segment {detail.segment_id}</CardTitle>
            <div className="flex gap-2 mt-1">
              <Badge variant="outline">{detail.road_class}</Badge>
              <span className="text-xs text-muted-foreground mt-0.5">{detail.lanes} lanes • {detail.length_m.toFixed(0)} m</span>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={clearSelectedSegment}>&times;</Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-4 space-y-6">
        
        {/* Width metrics */}
        <div className="grid grid-cols-3 gap-2 text-center border rounded-md p-3 bg-muted/10">
          <div>
            <p className="text-xs text-muted-foreground">Total Width</p>
            <p className="font-semibold">{detail.W_total.toFixed(1)} m</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground text-red-500">Blocked</p>
            <p className="font-semibold text-red-500">{(detail.W_total - detail.W_eff).toFixed(1)} m</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground text-green-500">Effective</p>
            <p className="font-semibold text-green-500">{detail.W_eff.toFixed(1)} m</p>
          </div>
        </div>

        {/* Capacity Metrics */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Base Capacity (K_j,base)</span>
            <span className="font-medium">{detail.K_j_base.toFixed(0)} veh/km</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Effective Capacity (K_j,eff)</span>
            <span className="font-medium">{detail.K_j_eff.toFixed(0)} veh/km</span>
          </div>
          <div className="flex justify-between text-sm font-semibold border-t pt-2">
            <span>Capacity Reduction</span>
            <span className={detail.capacityReduction > 20 ? 'text-red-500' : 'text-amber-500'}>
              {detail.capacityReduction.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Reference K Slider */}
        <div className="space-y-4 pt-4 border-t border-border">
          <div className="flex justify-between items-center">
            <Label className="text-sm font-semibold text-muted-foreground">Reference Density (K)</Label>
            <span className="text-sm font-medium">{referenceK} veh/km</span>
          </div>
          <Slider 
            min={MODEL_CONSTANTS.K_MIN} 
            max={MODEL_CONSTANTS.K_MAX} 
            step={1} 
            value={[referenceK]} 
            onValueChange={(val) => setReferenceK(Array.isArray(val) ? val[0] : val)} 
          />
        </div>

        {/* Speed Output */}
        <div className="bg-muted/20 p-4 rounded-md">
          {detail.isGridlocked ? (
            <GridlockAlert K={referenceK} K_j_eff={detail.K_j_eff} />
          ) : (
            <div className="flex justify-between items-center">
              <span className="font-medium text-muted-foreground">Predicted Speed (V)</span>
              <span className="text-2xl font-bold text-green-500">{detail.V.toFixed(1)} <span className="text-sm font-normal text-muted-foreground">km/h</span></span>
            </div>
          )}
        </div>

        {/* Mini Speed Density Curve */}
        <div className="h-32 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={detail.curve.points} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="K" type="number" hide domain={[0, Math.max(detail.K_j_base, MODEL_CONSTANTS.K_MAX)]} />
              <YAxis dataKey="V" hide domain={[0, MODEL_CONSTANTS.V_F]} />
              <Tooltip formatter={(value, name) => [value.toFixed(1), name]} labelFormatter={(label) => `Density: ${label.toFixed(1)}`} />
              <Line type="monotone" dataKey="V" name="Speed" stroke={SIMULATION_CHART_CONFIG.currentCurveColor} strokeWidth={2} dot={false} isAnimationActive={false} />
              <ReferenceDot x={detail.isGridlocked ? detail.K_j_eff : referenceK} y={detail.V} r={4} fill={SIMULATION_CHART_CONFIG.currentCurveColor} stroke="white" strokeWidth={2} />
              <ReferenceLine y={0} stroke={SIMULATION_CHART_CONFIG.gridlock.color} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Actions */}
        <div className="pt-2">
          <Button className="w-full mb-2" onClick={() => setCascadeOrigin(detail.segment_id)}>
            Launch Cascade From Here
          </Button>
        </div>

      </CardContent>
    </Card>
  );
}
