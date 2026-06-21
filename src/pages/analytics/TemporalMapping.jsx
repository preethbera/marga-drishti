import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@components/ui/card";
import { Slider } from "@components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@components/ui/select";
import MapContainer from '@components/custom/MapContainer';
import { AnalyticsService } from '@core/analytics/analytics.service';
import { useAnalyticsQuery } from "@core/hooks/useAnalyticsQuery";
import { Clock } from 'lucide-react';

export default function TemporalMapping() {
  
  // Filters
  const [hourRange, setHourRange] = useState([0, 23]);
  const [debouncedHourRange, setDebouncedHourRange] = useState([0, 23]);
  const [dayOfWeek, setDayOfWeek] = useState('all');

  // Debounce the slider to avoid thread locking
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedHourRange(hourRange);
    }, 300);
    return () => clearTimeout(handler);
  }, [hourRange]);

  const { data: mapData } = useAnalyticsQuery(
    () => AnalyticsService.getTemporalHotspots(debouncedHourRange, dayOfWeek),
    [debouncedHourRange, dayOfWeek],
    { useGlobalLoader: true }
  );

  const handleSliderChange = useCallback((value) => {
    setHourRange(value);
  }, []);

  return (
    <div className="flex flex-col w-full max-w-7xl mx-auto px-6 md:px-8 space-y-6 animate-in fade-in duration-500 min-h-screen">
      <div className="flex flex-col space-y-2 border-b pb-4">
        <h1 className="text-3xl font-bold tracking-tight">Temporal Analysis</h1>
        <p className="text-muted-foreground">
          Analyze spatial violation patterns over specific time windows and days.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 pt-2 h-[600px] lg:h-[700px]">
        {/* 70% Viewport for Map */}
        <div className="flex-1 lg:w-[70%] h-full relative shadow-lg rounded-xl overflow-hidden border border-border">
          <MapContainer mapData={mapData} />
        </div>

        {/* 30% Viewport for Controls */}
        <div className="lg:w-[30%] flex flex-col gap-4">
          <Card className="flex-1 shadow-md">
            <CardHeader className="bg-muted/30 border-b">
              <CardTitle>Temporal Controls</CardTitle>
              <CardDescription>Filter spatial data by time windows.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8 pt-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-semibold">Time Window</label>
                  <span className="text-sm font-mono bg-primary/10 text-primary px-2 py-1 rounded-md">
                    {String(hourRange[0]).padStart(2, '0')}:00 - {String(hourRange[1]).padStart(2, '0')}:00
                  </span>
                </div>
                <div className="pt-4 pb-2 px-2">
                  <Slider
                    value={hourRange}
                    min={0}
                    max={23}
                    step={1}
                    onValueChange={handleSliderChange}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-semibold">Day of Week</label>
                <Select value={dayOfWeek} onValueChange={setDayOfWeek}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All Days" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Days</SelectItem>
                    <SelectItem value="0">Sunday</SelectItem>
                    <SelectItem value="1">Monday</SelectItem>
                    <SelectItem value="2">Tuesday</SelectItem>
                    <SelectItem value="3">Wednesday</SelectItem>
                    <SelectItem value="4">Thursday</SelectItem>
                    <SelectItem value="5">Friday</SelectItem>
                    <SelectItem value="6">Saturday</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="bg-muted/40 p-4 rounded-xl mt-8 border border-border/50">
                <h4 className="text-sm font-semibold mb-2 flex items-center"><Clock className="w-4 h-4 mr-2 text-primary" /> Usage Tip</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Drag the time slider to observe how violation hotspots shift across the city during peak commuting hours versus late-night hours.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

