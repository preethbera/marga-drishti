import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { Activity, MapPin, Clock, AlertTriangle } from 'lucide-react';
import { AnalyticsService } from '@core/analytics/analytics.service';
import { useAnalyticsQuery } from "@core/hooks/useAnalyticsQuery";

export default function KpiCards() {
  const { data: kpis, isLoading, error } = useAnalyticsQuery(AnalyticsService.getExecutiveKPIs);

  if (isLoading || !kpis) {
    return <div className="h-24 flex items-center justify-center text-muted-foreground animate-pulse">Loading KPIs...</div>;
  }
  if (error) return <div className="text-red-500">Failed to load KPIs</div>;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 pt-2">
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Violations</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{kpis.totalViolations.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">Total physical tickets issued</p>
        </CardContent>
      </Card>
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Top Category</CardTitle>
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold truncate" title={kpis.topCategory}>{kpis.topCategory}</div>
          <p className="text-xs text-muted-foreground">Most frequent individual offense</p>
        </CardContent>
      </Card>
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Most Active Station</CardTitle>
          <MapPin className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold truncate" title={kpis.topStation}>{kpis.topStation}</div>
          <p className="text-xs text-muted-foreground">Highest enforcement area</p>
        </CardContent>
      </Card>
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Peak Hour</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{String(kpis.peakHour).padStart(2, '0')}:00 - {String(kpis.peakHour + 1).padStart(2, '0')}:00</div>
          <p className="text-xs text-muted-foreground">Highest volume of incidents</p>
        </CardContent>
      </Card>
    </div>
  );
}
