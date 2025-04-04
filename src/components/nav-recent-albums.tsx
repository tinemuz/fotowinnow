"use client"

import {Eye, type LucideIcon, MoreHorizontal, Share2, XCircle, Clock} from "lucide-react"
import { Album } from "@/types/database"
import Link from "next/link"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

export function NavRecentAlbums({
  albums,
}: {
  albums: Album[]
}) {
  const { isMobile } = useSidebar()
  const recentAlbums = albums.slice(0, 3) // Get the 3 most recent albums

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Recent Albums</SidebarGroupLabel>
      <SidebarMenu>
        {recentAlbums.map((album) => (
          <SidebarMenuItem key={album.id}>
            <SidebarMenuButton asChild>
              <Link href={`/dashboard/albums/${album.id}`}>
                <Clock className="h-4 w-4" />
                <span className="truncate">{album.name}</span>
              </Link>
            </SidebarMenuButton>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuAction showOnHover>
                  <MoreHorizontal />
                  <span className="sr-only">More</span>
                </SidebarMenuAction>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-48 rounded-lg"
                side={isMobile ? "bottom" : "right"}
                align={isMobile ? "end" : "start"}
              >
                <DropdownMenuItem asChild>
                  <Link href={`/dashboard/albums/${album.id}`}>
                    <Eye className="text-muted-foreground" />
                    <span>View Album</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Share2 className="text-muted-foreground" />
                  <span>Quick Share</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive">
                  <XCircle className="text-destructive" />
                  <span>Remove from Recents</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        ))}
        <SidebarMenuItem>
          <SidebarMenuButton asChild>
            <Link href="/dashboard/albums" className="text-sidebar-foreground/70">
              <MoreHorizontal className="text-sidebar-foreground/70" />
              <span>More</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  )
} 