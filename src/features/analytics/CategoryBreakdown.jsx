import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { AnalyticsService } from '@/services/analytics.service';
import { useAnalyticsQuery } from '@/hooks/useAnalyticsQuery';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#a855f7'];

export default function CategoryBreakdown() {
  const { data: categoryData, isLoading, error } = useAnalyticsQuery(AnalyticsService.getCategoryBreakdown);

  if (isLoading || !categoryData) {
    return <div className="h-[300px] flex items-center justify-center animate-pulse">Loading Categories...</div>;
  }
  if (error) return <div className="text-red-500">Failed to load Categories</div>;

  return (
    <Card className="col-span-3 hover:shadow-md transition-shadow">
      <CardHeader>
        <CardTitle>Category Breakdown</CardTitle>
        <CardDescription>Major violation distribution</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={90}
                paddingAngle={5}
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <RechartsTooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {categoryData.map((entry, i) => (
            <div key={entry.name} className="flex items-center text-xs font-medium bg-muted/50 px-2 py-1 rounded-md">
              <div className="w-2.5 h-2.5 rounded-full mr-2" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
              <span className="truncate max-w-[120px]" title={entry.name}>{entry.name}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
