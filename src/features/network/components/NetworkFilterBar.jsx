import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { NETWORK_CONFIG } from '../networkConfig';
import { useNetworkStore } from '../useNetworkStore';

export function NetworkFilterBar() {
  const { 
    timeWindowStart, 
    timeWindowEnd, 
    setTimeWindow,
    roadClassFilter,
    toggleRoadClass,
    resetNetworkFilters
  } = useNetworkStore();

  const handleTimePreset = (days) => {
    if (days === 0) {
      setTimeWindow(null, null);
      return;
    }
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    setTimeWindow(start.toISOString(), end.toISOString());
  };

  const isAllTime = !timeWindowStart && !timeWindowEnd;

  return (
    <Card className="w-full">
      <CardContent className="p-4 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
        
        {/* Time Window Filters */}
        <div className="flex flex-col gap-2">
          <span className="text-sm font-semibold text-muted-foreground">Time Window</span>
          <div className="flex flex-wrap gap-2">
            <Button 
              variant={isAllTime ? "default" : "outline"} 
              size="sm" 
              onClick={() => handleTimePreset(0)}
            >
              All Time
            </Button>
            <Button 
              variant={!isAllTime && timeWindowStart && new Date().getDate() - new Date(timeWindowStart).getDate() === 7 ? "default" : "outline"} 
              size="sm" 
              onClick={() => handleTimePreset(7)}
            >
              Last 7 Days
            </Button>
            <Button 
              variant={!isAllTime && timeWindowStart && new Date().getDate() - new Date(timeWindowStart).getDate() === 30 ? "default" : "outline"} 
              size="sm" 
              onClick={() => handleTimePreset(30)}
            >
              Last 30 Days
            </Button>
          </div>
        </div>

        {/* Road Class Filters */}
        <div className="flex flex-col gap-2 flex-1 max-w-xl">
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold text-muted-foreground">Road Classes</span>
            <span className="text-xs text-muted-foreground">{roadClassFilter.length === 0 ? 'All included' : `${roadClassFilter.length} selected`}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {NETWORK_CONFIG.roadClasses.order.map(cls => {
              const isActive = roadClassFilter.length === 0 || roadClassFilter.includes(cls);
              return (
                <Badge
                  key={cls}
                  variant={isActive ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleRoadClass(cls)}
                >
                  {cls}
                </Badge>
              );
            })}
          </div>
        </div>

        <div className="flex items-center">
          <Button variant="ghost" size="sm" onClick={resetNetworkFilters} className="text-muted-foreground">
            Reset Filters
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
