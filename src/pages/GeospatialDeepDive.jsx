import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getRegionalData } from '@/lib/duckdbEngine';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { useUiStore } from '@/store/useUiStore';
import { MapPin, Building2 } from 'lucide-react';

export default function GeospatialDeepDive() {
  const [centerCode, setCenterCode] = useState('all');
  const [policeStation, setPoliceStation] = useState('all');
  const [data, setData] = useState(null);

  useEffect(() => {
    loadData();
  }, [centerCode, policeStation]);

  async function loadData() {
    useUiStore.getState().setIsLoading(true);
    const result = await getRegionalData(centerCode, policeStation, 'all');
    setData(result);
    useUiStore.getState().setIsLoading(false);
  }

  if (!data) return (
    <div className="flex flex-col w-full max-w-7xl mx-auto px-6 space-y-6">
      <div className="h-64 flex items-center justify-center text-muted-foreground animate-pulse">Loading Geospatial Data...</div>
    </div>
  );

  return (
    <div className="flex flex-col w-full max-w-7xl mx-auto px-6 md:px-8 space-y-6 animate-in fade-in duration-500 min-h-screen">
      <div className="flex flex-col space-y-2 border-b pb-4">
        <h1 className="text-3xl font-bold tracking-tight">Geospatial Deep Dive</h1>
        <p className="text-muted-foreground">
          Analyze localized enforcement metrics, station performance, and junction hotspots.
        </p>
      </div>

      {/* Filters Row */}
      <Card className="shadow-sm border-border/50">
        <CardContent className="p-4 flex flex-col md:flex-row gap-6">
          <div className="space-y-2 flex-1">
            <label className="text-sm font-semibold flex items-center gap-2 text-muted-foreground"><MapPin className="w-4 h-4"/> Center Code</label>
            <Select value={centerCode} onValueChange={setCenterCode}>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="All Centers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Centers</SelectItem>
                <SelectItem value="1">Center 1</SelectItem>
                <SelectItem value="2">Center 2</SelectItem>
                <SelectItem value="3">Center 3</SelectItem>
                <SelectItem value="4">Center 4</SelectItem>
                <SelectItem value="5">Center 5</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 flex-1">
            <label className="text-sm font-semibold flex items-center gap-2 text-muted-foreground"><Building2 className="w-4 h-4"/> Police Station</label>
            <Select value={policeStation} onValueChange={setPoliceStation}>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="All Stations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stations</SelectItem>
                {data.stations.map(s => (
                  <SelectItem key={s.police_station} value={s.police_station}>{s.police_station}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Table View */}
        <Card className="lg:col-span-2 hover:shadow-md transition-shadow">
          <CardHeader className="bg-muted/30 border-b">
            <CardTitle>Station Performance</CardTitle>
            <CardDescription>Violations and primary issues by station</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-auto max-h-[600px]">
              <Table>
                <TableHeader className="bg-muted/50 sticky top-0 z-10 shadow-sm">
                  <TableRow>
                    <TableHead className="font-bold">Station</TableHead>
                    <TableHead className="text-right font-bold">Violations</TableHead>
                    <TableHead className="font-bold">Primary Vehicle</TableHead>
                    <TableHead className="font-bold">Primary Violation</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.stations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No data available</TableCell>
                    </TableRow>
                  ) : (
                    data.stations.map((station, i) => (
                      <TableRow key={i} className="hover:bg-muted/30">
                        <TableCell className="font-medium">{station.police_station}</TableCell>
                        <TableCell className="text-right">{station.violations.toLocaleString()}</TableCell>
                        <TableCell>{station.primary_vehicle}</TableCell>
                        <TableCell className="max-w-[200px] truncate" title={station.primary_violation}>
                          {station.primary_violation}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Charts Side */}
        <div className="space-y-6 lg:col-span-1">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="bg-muted/30 border-b pb-4">
              <CardTitle className="text-base">Junction Hotspot Ranking</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.junctions} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-muted" />
                    <XAxis type="number" className="text-xs" tickLine={false} axisLine={false} />
                    <YAxis dataKey="name" type="category" className="text-xs font-medium" tickLine={false} axisLine={false} width={100} />
                    <RechartsTooltip cursor={{fill: 'hsl(var(--muted))', opacity: 0.4}} contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }} />
                    <Bar dataKey="value" fill="hsl(var(--destructive))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="bg-muted/30 border-b pb-4">
              <CardTitle className="text-base">Regional Violation Profile</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data.radar}>
                    <PolarGrid stroke="hsl(var(--border))" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: 'hsl(var(--foreground))', fontSize: 11, fontWeight: 500 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                    <Radar name="Violations" dataKey="A" stroke="hsl(var(--primary))" strokeWidth={2} fill="hsl(var(--primary))" fillOpacity={0.4} />
                    <RechartsTooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
