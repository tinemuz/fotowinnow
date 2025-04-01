"use client"

import * as React from "react"
import {
  AudioWaveform,
  BookOpen,
  Bot,
  Command,
  Frame,
  GalleryVerticalEnd,
  LayoutDashboard,
  Album,
  Map,
  PieChart,
  Settings2,
  SquareTerminal,
  Clock,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavRecentAlbums } from "@/components/nav-recent-albums"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import {SignedIn, UserButton} from "@clerk/nextjs";

// This is sample data.
const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      name: "Acme Inc",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    },
    {
      name: "Acme Corp.",
      logo: AudioWaveform,
      plan: "Startup",
    },
    {
      name: "Evil Corp.",
      logo: Command,
      plan: "Free",
    },
  ],
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Albums",
      url: "/dashboard/albums",
      icon: Album,
    },
    {
      title: "Settings",
      url: "/dashboard/settings",
      icon: Settings2,
    },
  ],
  recentAlbums: [
    {
      name: "Wedding Shoot - June '24",
      url: "/dashboard/albums/wedding-june-24",
      icon: Clock,
    },
    {
      name: "Product Catalog - Q2",
      url: "/dashboard/albums/product-q2",
      icon: Clock,
    },
    {
      name: "Family Portraits - May",
      url: "/dashboard/albums/family-may",
      icon: Clock,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavRecentAlbums albums={data.recentAlbums} />
        <SignedIn>
          <UserButton/>
        </SignedIn>
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

