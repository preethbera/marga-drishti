import React, { useMemo } from 'react';
import { TriangleAlert, Building } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';
import { Progress } from '../ui/progress';

function TopListCard({ title, icon: Icon, description, items, total, isLoading }) {
  if (isLoading) {
    return (
      <div className="border rounded-lg p-5 bg-card flex flex-col gap-4">
        <div className="flex items-center gap-2 mb-2">
          <Icon className="w-5 h-5 text-muted-foreground" />
          <h3 className="font-semibold text-lg">{title}</h3>
        </div>
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  const maxCount = items.length > 0 ? items[0].count : 1;

  return (
    <div className="border rounded-lg p-5 bg-card">
      <div className="flex items-center gap-2">
        <Icon className="w-5 h-5 text-muted-foreground" />
        <h3 className="font-semibold text-lg">{title}</h3>
      </div>
      <p className="text-sm text-muted-foreground mt-1 mb-4">{description}</p>
      
      <div className="flex flex-col gap-3">
        {items.map((item, index) => {
          const share = total > 0 ? ((item.count / total) * 100).toFixed(1) : 0;
          const progress = (item.count / maxCount) * 100;

          return (
            <div 
              key={index} 
              className="group flex items-center justify-between py-2 border-b last:border-0 hover:bg-muted/50 rounded transition-colors"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0 pr-4">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" title={item.label}>
                    {item.label}
                  </p>
                  <div className="w-3/4 mt-1">
                    <Progress value={progress} className="h-1.5" />
                  </div>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-bold">{item.count.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">{share}% of total</p>
              </div>
            </div>
          );
        })}
        {items.length === 0 && (
          <div className="py-8 text-center text-muted-foreground text-sm">
            No data available
          </div>
        )}
      </div>
    </div>
  );
}

export default function TopLists({ topOffences, topStations, stats, mappings, isLoading }) {
  const currentTotal = Number(stats?.total_violations?.[0] || 0);

  const offenceItems = useMemo(() => {
    if (!topOffences || !topOffences.code || !topOffences.count) return [];
    
    // Convert mapping array to dictionary
    const offenceDict = {};
    if (mappings && mappings.offences) {
      mappings.offences.forEach(m => {
        offenceDict[m.code] = m.name;
      });
    }

    return Array.from(topOffences.code).map((code, i) => {
      const name = offenceDict[code] || 'UNKNOWN';
      return {
        code,
        label: `${code} — ${name}`,
        count: Number(topOffences.count[i])
      };
    });
  }, [topOffences, mappings]);

  const stationItems = useMemo(() => {
    if (!topStations || !topStations.code || !topStations.count) return [];
    
    // Convert mapping array to dictionary
    const stationDict = {};
    if (mappings && mappings.centers) {
      mappings.centers.forEach(m => {
        stationDict[m.code] = m.name;
      });
    }

    return Array.from(topStations.code).map((code, i) => {
      const name = stationDict[code] || `Station ${code}`;
      return {
        code,
        label: name,
        count: Number(topStations.count[i])
      };
    });
  }, [topStations, mappings]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
      <TopListCard 
        title="Top 5 Offences" 
        icon={TriangleAlert} 
        description="Most ticketed offence codes." 
        items={offenceItems} 
        total={currentTotal}
        isLoading={isLoading}
      />
      <TopListCard 
        title="Top 5 Police Stations" 
        icon={Building} 
        description="Jurisdictions with the highest volume." 
        items={stationItems} 
        total={currentTotal}
        isLoading={isLoading}
      />
    </div>
  );
}
