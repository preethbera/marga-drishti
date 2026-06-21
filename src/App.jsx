import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";

import Layout from "@/components/layout/Layout";
import ExecutiveSummary from "@/pages/ExecutiveSummary";
import TemporalMapping from "@/pages/TemporalMapping";
import GeospatialAnalysis from "@/pages/GeospatialAnalysis";
import ExploratorySandbox from "@/pages/ExploratorySandbox";
import Settings from "@/pages/Settings";
import DataManagement from "@/pages/DataManagement";
import AnalyticsGuard from "@/components/layout/AnalyticsGuard";
import { initializeAppData } from "@/components/GlobalDataLoader";
import SimulationStudio from "@/features/simulation/SimulationStudio";
import NetworkIntelligence from "@/pages/NetworkIntelligence";

// Fire data initialization immediately on module load.
// This runs before any React component mounts, eliminating race conditions.
initializeAppData();

export default function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="clearway-ui-theme">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/analytics/executive" replace />} />
            
            <Route path="analytics" element={<AnalyticsGuard />}>
              <Route path="executive" element={<ExecutiveSummary />} />
              <Route path="temporal" element={<TemporalMapping />} />
              <Route path="geospatial" element={<GeospatialAnalysis />} />
              <Route path="sandbox" element={<ExploratorySandbox />} />
            </Route>
            
            <Route path="data-ingestion" element={<DataManagement />} />
            <Route path="settings" element={<Settings />} />
            <Route path="simulation/studio" element={<SimulationStudio />} />
            <Route path="network/intelligence" element={<NetworkIntelligence />} />
            
            <Route path="*" element={<Navigate to="/analytics/executive" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
