import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/app/theme-provider";

import Layout from "@layouts/Layout";
import GeospatialAnalysis from "@pages/analytics/GeospatialAnalysis";
import ExecutiveSummary from "@pages/analytics/ExecutiveSummary";
import TemporalAnalysis from "@pages/analytics/TemporalAnalysis";
import SimulationStudio from "@pages/simulation/SimulationStudio";
import NetworkIntelligence from "@pages/simulation/NetworkIntelligence";
import Settings from "@pages/system/Settings";

export default function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="clearway-ui-theme">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/analytics/executive" replace />} />
            
            {/* Analytics Routes */}
            <Route path="analytics">
              <Route path="executive" element={<ExecutiveSummary />} />
              <Route path="geospatial" element={<GeospatialAnalysis />} />
              <Route path="temporal" element={<TemporalAnalysis />} />
              {/* Fallback for other analytics routes not yet implemented */}
              <Route path="*" element={<Navigate to="/analytics/executive" replace />} />
            </Route>

            {/* Simulation Routes */}
            <Route path="simulation">
              <Route index element={<Navigate to="/simulation/network" replace />} />
              <Route path="network" element={<NetworkIntelligence />} />
              <Route path="studio" element={<SimulationStudio />} />
              <Route path="*" element={<Navigate to="/simulation/network" replace />} />
            </Route>

            {/* Legacy route fallback */}
            <Route path="geospatial" element={<Navigate to="/analytics/geospatial" replace />} />

            <Route path="settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/analytics/executive" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
