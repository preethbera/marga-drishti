import React from 'react';
import { Card, CardContent } from '@components/ui/card';
import { Badge } from '@components/ui/badge';
import { Button } from '@components/ui/button';
import { NETWORK_CONFIG } from '@features/network/networkConfig';
export function NetworkFilterBar({
  isPresetActive,
  handleTimePreset,
  roadClassFilter,
  toggleRoadClass,
  resetNetworkFilters
}) {

  return (
    <Card className="w-full">
      <CardContent className="p-4 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
        
        {/* Time Window Filters */}
        <div className="flex flex-col gap-2">
          <span className="text-sm font-semibold text-muted-foreground">Time Window</span>
          <div className="flex flex-wrap gap-2">
            <Button 
              variant={isPresetActive(0) ? "default" : "outline"} 
              size="sm" 
              onClick={() => handleTimePreset(0)}
            >
              All Time
            </Button>
            <Button 
              variant={isPresetActive(7) ? "default" : "outline"} 
              size="sm" 
              onClick={() => handleTimePreset(7)}
            >
              Last 7 Days
            </Button>
            <Button 
              variant={isPresetActive(30) ? "default" : "outline"} 
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
