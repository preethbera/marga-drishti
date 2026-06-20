"use client"

import * as React from "react"
import {
  BarChart3,
  Database,
  FileText,
  Map,
  MapPin,
  Settings,
  Shield,
  ShieldAlert,
  Video,
} from "lucide-react"

import { NavMain } from "@/components/layout/nav-main"
import { NavProjects } from "@/components/layout/nav-projects"
import { NavUser } from "@/components/layout/nav-user"
import { TeamSwitcher } from "@/components/layout/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

// Traffic Enforcement and Parking Analytics Data
const data = {
  user: {
    name: "Officer 402",
    email: "hq@clearway.gov",
    role: "Dispatcher",
    avatar: "",
  },
  teams: [
    {
      name: "Sector 1",
      logo: MapPin,
      plan: "North Zone",
    },
    {
      name: "Sector 2",
      logo: MapPin,
      plan: "South Zone",
    },
    {
      name: "Sector 3",
      logo: Shield,
      plan: "Central District",
    },
  ],
  navMain: [
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
  ],
  projects: [
    {
      name: "Data Ingestion",
      url: "/data-ingestion",
      icon: Database,
    },
    {
      name: "Settings",
      url: "/settings",
      icon: Settings,
    },
  ],
}

export function AppSidebar({ ...props }) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavProjects projects={data.projects} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}