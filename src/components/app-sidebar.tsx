"use client"

import * as React from "react"
import {Album, AudioWaveform, Clock, Command, GalleryVerticalEnd, LayoutDashboard, Settings2,} from "lucide-react"
import { useEffect, useState } from "react"
import { Album as AlbumType } from "@/types/database"
import { getAlbums } from "@/lib/actions/albums"

import {NavMain} from "@/components/nav-main"
import {NavRecentAlbums} from "@/components/nav-recent-albums"
import {NavUser} from "@/components/nav-user"
import {TeamSwitcher} from "@/components/team-switcher"
import {Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail,} from "@/components/ui/sidebar"
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
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [albums, setAlbums] = useState<AlbumType[]>([])

  useEffect(() => {
    const fetchAlbums = async () => {
      try {
        const fetchedAlbums = await getAlbums()
        setAlbums(fetchedAlbums)
      } catch (error) {
        console.error('Failed to fetch albums:', error)
      }
    }

    fetchAlbums()
  }, [])

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavRecentAlbums albums={albums} />
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

