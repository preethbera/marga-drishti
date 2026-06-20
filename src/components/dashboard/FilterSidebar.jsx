import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useUiStore } from '@/store/useUiStore';


const VEHICLE_TYPES = ['LMV', 'HMV', '2W', '3W'];
const OFFENCE_CODES = [
  { code: 101, label: '101 - Speeding' },
  { code: 102, label: '102 - Signal Jump' },
  { code: 103, label: '103 - Wrong Parking' },
  { code: 104, label: '104 - No Helmet' },
];

export default function FilterSidebar({ onDataUpdate }) {
  const { filters, setFilters } = useUiStore();
  const [localHourRange, setLocalHourRange] = useState(filters.hourRange);

  // Debounced slider update
  useEffect(() => {
    const handler = setTimeout(() => {
      setFilters({ hourRange: localHourRange });
    }, 500);
    return () => clearTimeout(handler);
  }, [localHourRange, setFilters]);

  // Execute DuckDB query whenever filters change in Zustand
  useEffect(() => {
    let active = true;
    const fetch = async () => {
      const data = await executeFilterQuery(filters);
      if (active && onDataUpdate) {
        onDataUpdate(data);
      }
    };
    fetch();
    return () => { active = false; };
  }, [filters, onDataUpdate]);

  const toggleVehicleType = (type) => {
    const current = filters.vehicleTypes;
    const updated = current.includes(type) 
      ? current.filter(t => t !== type)
      : [...current, type];
    setFilters({ vehicleTypes: updated });
  };

  const toggleOffenceCode = (code) => {
    const current = filters.offenceCodes;
    const updated = current.includes(code)
      ? current.filter(c => c !== code)
      : [...current, code];
    setFilters({ offenceCodes: updated });
  };

  return (
    <div className="w-80 flex flex-col gap-4 overflow-y-auto pr-2">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Vehicle Types</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {VEHICLE_TYPES.map(type => (
            <div key={type} className="flex items-center space-x-2">
              <Checkbox 
                id={`vt-${type}`} 
                checked={filters.vehicleTypes.includes(type)}
                onCheckedChange={() => toggleVehicleType(type)}
              />
              <Label htmlFor={`vt-${type}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                {type}
              </Label>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Offence Codes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {OFFENCE_CODES.map(item => (
            <div key={item.code} className="flex items-center space-x-2">
              <Checkbox 
                id={`vc-${item.code}`} 
                checked={filters.offenceCodes.includes(item.code)}
                onCheckedChange={() => toggleOffenceCode(item.code)}
              />
              <Label htmlFor={`vc-${item.code}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                {item.label}
              </Label>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Hour of Day</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 pt-2">
          <Slider
            defaultValue={localHourRange}
            min={0}
            max={23}
            step={1}
            onValueChange={setLocalHourRange}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{String(localHourRange[0]).padStart(2, '0')}:00</span>
            <span>{String(localHourRange[1]).padStart(2, '0')}:00</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
