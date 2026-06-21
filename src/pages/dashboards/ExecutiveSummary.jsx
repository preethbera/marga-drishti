import React from 'react';
import KpiCards from '@features/analytics/components/KpiCards';
import TrendChart from '@features/analytics/components/TrendChart';
import CategoryBreakdown from '@features/analytics/components/CategoryBreakdown';
import VehicleClassification from '@features/analytics/components/VehicleClassification';

export default function ExecutiveSummary() {
  return (
    <div className="flex flex-col w-full max-w-7xl mx-auto px-6 space-y-6">
      <div className="flex flex-col space-y-2 border-b pb-4">
        <h1 className="text-3xl font-bold tracking-tight">Executive Summary</h1>
        <p className="text-muted-foreground">
          High-level operational overview of Bengaluru traffic enforcement.
        </p>
      </div>

      <KpiCards />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <TrendChart />
        <CategoryBreakdown />
      </div>

      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-1 pb-8">
        <VehicleClassification />
      </div>
    </div>
  );
}
