import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Info, ChevronDown, Check } from 'lucide-react';
import { AnalyticsService } from '@/services/analytics.service';
import { useSimulationStore } from '../useSimulationStore';
import { useUiStore } from '@/store/useUiStore';
import { getPCU } from '../modelEngine';

const ARCHETYPAL_PRESETS = [
  { segment_id: 'archetype_1', name: 'Narrow Local Road', width_m: 5.0, road_class: 'local', lanes: 1 },
  { segment_id: 'archetype_2', name: 'Standard Two-Lane Arterial', width_m: 7.2, road_class: 'arterial', lanes: 2 },
  { segment_id: 'archetype_3', name: 'Wide Sub-Arterial', width_m: 10.0, road_class: 'sub_arterial', lanes: 3 },
  { segment_id: 'archetype_4', name: 'Wide Arterial / Boulevard', width_m: 14.0, road_class: 'arterial', lanes: 4 },
];

export function PresetLibrary() {
  const { applyPreset, selectedPresetId } = useSimulationStore();
  const isDataLoaded = useUiStore(state => state.isDataLoaded);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [presets, setPresets] = useState([]);
  const [loadViolationPCU, setLoadViolationPCU] = useState(false);
  const [fallbackToArchetypes, setFallbackToArchetypes] = useState(false);

  useEffect(() => {
    if (!isDataLoaded) return;
    
    async function fetchPresets() {
      setLoading(true);
      try {
        const segments = await AnalyticsService.getSegmentPresets();
        if (!segments || segments.length === 0) {
          setFallbackToArchetypes(true);
          setLoading(false);
          return;
        }

        // Fetch violation PCU optionally
        const violations = await AnalyticsService.getSegmentWithViolationPCU();
        
        // Aggregate PCU per segment
        const segmentPCU = {};
        if (violations && violations.length > 0) {
          violations.forEach(v => {
            const seg = String(v.segment_id);
            const pcuValue = getPCU(v.vehicle_type) * v.c;
            segmentPCU[seg] = (segmentPCU[seg] || 0) + pcuValue;
          });
        }

        const enriched = segments.map(seg => ({
          ...seg,
          pcu_current: segmentPCU[seg.segment_id]
        }));

        setPresets(enriched);
        setFallbackToArchetypes(false);
      } catch (e) {
        console.error("Failed to load presets", e);
        setFallbackToArchetypes(true);
      } finally {
        setLoading(false);
      }
    }
    fetchPresets();
  }, [isDataLoaded]);

  const handleSelect = (preset) => {
    applyPreset({
      ...preset,
      pcu_current: loadViolationPCU ? preset.pcu_current : undefined
    });
    setOpen(false);
  };

  const handleClear = () => {
    useSimulationStore.getState().setSelectedPresetId(null);
    setOpen(false);
  };

  const selectedPreset = [...presets, ...ARCHETYPAL_PRESETS].find(p => p.segment_id === selectedPresetId);

  // Grouping segments
  const groupedPresets = presets.reduce((acc, curr) => {
    if (!acc[curr.road_class]) acc[curr.road_class] = [];
    acc[curr.road_class].push(curr);
    return acc;
  }, {});

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex justify-between items-center">
          Segment Preset Library
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center w-full">
          
          <div className="flex-1 max-w-sm">
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger className="inline-flex items-center justify-between whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 w-full">
                {selectedPreset ? (selectedPreset.name || `Segment ${selectedPreset.segment_id}`) : "Select a road segment..."}
                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </PopoverTrigger>
              <PopoverContent className="w-[400px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search segment ID, class, or width..." />
                  <CommandList>
                    <CommandEmpty>No segment found.</CommandEmpty>
                    <CommandGroup heading="Actions">
                      <CommandItem onSelect={handleClear} className="font-semibold text-muted-foreground">
                        Clear preset
                      </CommandItem>
                    </CommandGroup>
                    
                    {loading ? (
                      <div className="p-4 space-y-2">
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-full" />
                      </div>
                    ) : (
                      Object.entries(groupedPresets).map(([rClass, items]) => (
                        <CommandGroup key={rClass} heading={`Class: ${rClass.toUpperCase()}`}>
                          {items.slice(0, 50).map((preset) => (
                            <CommandItem 
                              key={preset.segment_id} 
                              value={`${preset.segment_id} ${preset.road_class} ${preset.width_m}`}
                              onSelect={() => handleSelect(preset)}
                              className="flex flex-col items-start py-2"
                            >
                              <div className="flex items-center w-full justify-between">
                                <span className="font-medium text-sm">Seg {preset.segment_id.slice(0, 8)}...</span>
                                {selectedPresetId === preset.segment_id && <Check className="h-4 w-4" />}
                              </div>
                              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground w-full">
                                <Badge variant="secondary" className="text-[10px]">{preset.road_class}</Badge>
                                <span>{preset.width_m.toFixed(1)} m</span>
                                <span>• {preset.lanes} lanes</span>
                                {preset.pcu_current !== undefined && (
                                  <span className="ml-auto font-medium text-amber-500">PCU: {preset.pcu_current.toFixed(1)}</span>
                                )}
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      ))
                    )}
                  </CommandList>
                </Command>
                <div className="p-3 border-t bg-muted/30">
                  <div className="flex items-center space-x-2">
                    <Switch id="load-pcu" checked={loadViolationPCU} onCheckedChange={setLoadViolationPCU} />
                    <label htmlFor="load-pcu" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Also load current violations PCU
                    </label>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex gap-2 flex-wrap">
            {ARCHETYPAL_PRESETS.map((arch) => (
              <Button 
                key={arch.segment_id} 
                variant={selectedPresetId === arch.segment_id ? "default" : "secondary"}
                size="sm"
                onClick={() => handleSelect(arch)}
              >
                {arch.name} ({arch.width_m}m)
              </Button>
            ))}
          </div>

        </div>

        {fallbackToArchetypes && (
          <Alert className="mt-4 bg-muted/30">
            <Info className="h-4 w-4" />
            <AlertTitle>Live segment data unavailable</AlertTitle>
            <AlertDescription className="text-xs text-muted-foreground">
              Load a segments dataset in Data Management to enable real segment presets. Showing standard archetypes.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
