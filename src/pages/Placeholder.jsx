import React from "react";
import { useLocation } from "react-router-dom";

export default function PlaceholderPage() {
  const location = useLocation();
  const pathName = location.pathname.split('/').pop().replace(/-/g, ' ');

  return (
    <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm">
      <div className="flex flex-col items-center gap-1 text-center">
        <h3 className="text-2xl font-bold tracking-tight capitalize">
          {pathName}
        </h3>
        <p className="text-sm text-muted-foreground">
          This page is currently under construction.
        </p>
      </div>
    </div>
  );
}
