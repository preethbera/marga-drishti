import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";

import Layout from "@/components/layout/Layout";
import ExecutiveSummary from "@/pages/ExecutiveSummary";
import TemporalMapping from "@/pages/TemporalMapping";
import GeospatialDeepDive from "@/pages/GeospatialDeepDive";
import ExploratorySandbox from "@/pages/ExploratorySandbox";
import Settings from "@/pages/Settings";
import DataManagement from "@/pages/DataManagement";
import PlaceholderPage from "@/pages/Placeholder";

export default function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="clearway-ui-theme">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/analytics/executive" replace />} />
            
            <Route path="analytics/executive" element={<ExecutiveSummary />} />
            <Route path="analytics/temporal" element={<TemporalMapping />} />
            <Route path="analytics/geospatial" element={<GeospatialDeepDive />} />
            <Route path="analytics/sandbox" element={<ExploratorySandbox />} />
            
            <Route path="data-ingestion" element={<DataManagement />} />
            <Route path="settings" element={<Settings />} />
            
            <Route path="*" element={<Navigate to="/analytics/executive" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
