import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts';
import { AnalyticsService } from '@core/analytics/analytics.service';
import { useAnalyticsQuery } from '@core/hooks/useAnalyticsQuery';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#a855f7'];

export default function VehicleClassification() {
  const { data: vehicleData, isLoading, error } = useAnalyticsQuery(AnalyticsService.getVehicleClassification);

  if (isLoading || !vehicleData) {
    return <div className="h-[350px] flex items-center justify-center animate-pulse">Loading Vehicles...</div>;
  }
  if (error) return <div className="text-red-500">Failed to load Vehicle Classification</div>;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <CardTitle>Vehicle Classification</CardTitle>
        <CardDescription>Volume of tickets by vehicle type</CardDescription>
      </CardHeader>
      <CardContent className="pl-2">
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={vehicleData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
              <XAxis dataKey="name" className="text-xs" tickLine={false} axisLine={false} />
              <YAxis className="text-xs" tickLine={false} axisLine={false} />
              <RechartsTooltip cursor={{fill: 'hsl(var(--muted))', opacity: 0.4}} contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }} />
              <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]}>
                {vehicleData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
