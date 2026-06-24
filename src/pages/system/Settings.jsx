import React from "react";
import { useTheme } from "@app/theme-provider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@components/ui/card";
import { Button } from "@components/ui/button";

export default function Settings() {
  const { theme, setTheme } = useTheme();

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
                  className="flex-1"
                >
                  Light Mode
                </Button>
                <Button 
                  variant={theme === "dark" ? "default" : "outline"}
                  onClick={() => setTheme("dark")}
                  className="flex-1"
                >
                  Dark Mode
                </Button>
                <Button 
                  variant={theme === "system" ? "default" : "outline"}
                  onClick={() => setTheme("system")}
                  className="flex-1"
                >
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
        </div>
      </div>
    </div>
  );
}
