import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/app/theme-provider";

import Layout from "@layouts/Layout";
import GeospatialAnalysis from "@pages/analytics/GeospatialAnalysis";
import ExecutiveSummary from "@pages/analytics/ExecutiveSummary";
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
              {/* Fallback for other analytics routes not yet implemented */}
              <Route path="*" element={<Navigate to="/analytics/executive" replace />} />
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
