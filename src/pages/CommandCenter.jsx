import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function CommandCenter() {
  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="grid auto-rows-min gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active Violations</CardDescription>
            <CardTitle className="text-4xl">127</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">+12% from last hour</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Gridlock Alerts</CardDescription>
            <CardTitle className="text-4xl">4</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-destructive">Requires immediate dispatch</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Units Dispatched</CardDescription>
            <CardTitle className="text-4xl">42</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">Across all sectors</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>System Status</CardDescription>
            <CardTitle className="text-4xl text-green-500">Operational</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">All camera feeds active</div>
          </CardContent>
        </Card>
      </div>
      <div className="min-h-[50vh] flex-1 rounded-xl bg-muted/50 border border-dashed flex items-center justify-center">
        <p className="text-muted-foreground">Live Map View Placeholder</p>
      </div>
    </div>
  );
}
