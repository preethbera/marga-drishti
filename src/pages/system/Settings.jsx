import React from "react";
import { useTheme } from "@app/theme-provider";
import { useSettingsStore } from "../../store/useSettingsStore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@components/ui/card";
import { Button } from "@components/ui/button";
import { Check } from "lucide-react";

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const { mapStyle, setMapStyle } = useSettingsStore();

  return (
    <div className="flex flex-col h-[calc(100vh-theme(spacing.16))] w-full m-0 p-6 overflow-y-auto animate-in fade-in duration-500 bg-background">
      <div className="max-w-[1400px] w-full mx-auto space-y-6 pb-12">
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
          <p className="text-muted-foreground">Manage your application preferences and account settings.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="flex flex-col shadow-sm">
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>
                Customize the appearance of the application. Automatically switch between day and night themes.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="flex flex-wrap items-center gap-4">
                <Button 
                  variant={theme === "light" ? "default" : "outline"}
                  onClick={() => setTheme("light")}
                  className="flex-1 gap-2"
                >
                  {theme === "light" && <Check className="h-4 w-4" />}
                  Light Mode
                </Button>
                <Button 
                  variant={theme === "dark" ? "default" : "outline"}
                  onClick={() => setTheme("dark")}
                  className="flex-1 gap-2"
                >
                  {theme === "dark" && <Check className="h-4 w-4" />}
                  Dark Mode
                </Button>
                <Button 
                  variant={theme === "system" ? "default" : "outline"}
                  onClick={() => setTheme("system")}
                  className="flex-1 gap-2"
                >
                  {theme === "system" && <Check className="h-4 w-4" />}
                  System
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card className="flex flex-col shadow-sm">
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>
                Manage your account settings and preferences.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="space-y-4">
                <div className="grid gap-1">
                  <p className="text-sm font-medium leading-none">User</p>
                  <p className="text-sm text-muted-foreground">Officer 402 (hq@clearway.gov)</p>
                </div>
                <div className="grid gap-1">
                  <p className="text-sm font-medium leading-none">Role</p>
                  <p className="text-sm text-muted-foreground">Dispatcher</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="flex flex-col shadow-sm">
            <CardHeader>
              <CardTitle>Map Style</CardTitle>
              <CardDescription>
                Choose the base map style for all geospatial visualizations.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="flex flex-wrap items-center gap-4">
                <Button 
                  variant={mapStyle === "dark" ? "default" : "outline"}
                  onClick={() => setMapStyle("dark")}
                  className="flex-1 gap-2"
                >
                  {mapStyle === "dark" && <Check className="h-4 w-4" />}
                  Dark
                </Button>
                <Button 
                  variant={mapStyle === "light" ? "default" : "outline"}
                  onClick={() => setMapStyle("light")}
                  className="flex-1 gap-2"
                >
                  {mapStyle === "light" && <Check className="h-4 w-4" />}
                  Light
                </Button>
                <Button 
                  variant={mapStyle === "voyager" ? "default" : "outline"}
                  onClick={() => setMapStyle("voyager")}
                  className="flex-1 gap-2"
                >
                  {mapStyle === "voyager" && <Check className="h-4 w-4" />}
                  Voyager
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
