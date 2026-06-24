"use client";

import * as React from "react";
import {
  BarChart3,
  Database,
  Map,
  Settings,
  BookOpen,
} from "lucide-react";


import { NavMain } from "@layouts/nav-main";
import { NavSecondary } from "@layouts/nav-secondary";
import { NavUser } from "@layouts/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@components/ui/sidebar";

// Traffic Enforcement and Parking Analytics Data
const data = {
  user: {
    name: "Officer 402",
    email: "hq@clearway.gov",
    role: "Dispatcher",
    avatar: "",
  },

  navGroups: [
    {
      title: "Analysis & Simulation",
      items: [
        {
          title: "Analytics",
          url: "/analytics",
          icon: BarChart3,
          isActive: true,
          items: [
            {
              title: "Executive Summary",
              url: "/analytics/executive",
            },
            {
              title: "Temporal Analysis",
              url: "/analytics/temporal",
            },
            {
              title: "Geospatial Analysis",
              url: "/analytics/geospatial",
            },
            {
              title: "Exploratory Sandbox",
              url: "/analytics/sandbox",
            },
          ],
        },
        {
          title: "Simulation",
          url: "/simulation",
          icon: Map,
          isActive: false,
          items: [
            {
              title: "Simulation Studio",
              url: "/simulation/studio",
            },
            {
              title: "Network Intelligence",
              url: "/simulation/network",
            },
          ],
        },
      ]
    },
    {
      title: "Documentation & Methodology",
      items: [
        {
          title: "Documentation",
          url: "/docs",
          icon: BookOpen,
          isActive: true,
          items: [
            {
              title: "Simulation Model",
              url: "/docs/simulation-model",
            },
            {
              title: "Features & Capabilities",
              url: "/docs/features-capabilities",
            },
            {
              title: "Data Aggregation & Methodology",
              url: "/docs/aggregation-methodology",
            },
          ],
        },
      ]
    }
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "/settings",
      icon: Settings,
    },
  ],
};

export function AppSidebar({ ...props }) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="border-b border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg">
              <div className="flex aspect-square size-8 items-center justify-center">
                <img
                  src="/logo.svg"
                  alt="Marga Drishti Logo"
                  className="size-5"
                />
              </div>
              <span className="truncate font-semibold text-sm">Marga Drishti</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {data.navGroups.map((group) => (
          <NavMain key={group.title} title={group.title} items={group.items} />
        ))}
      </SidebarContent>
      <SidebarFooter>
        <NavSecondary items={data.navSecondary} />
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
