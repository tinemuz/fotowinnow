"use client"

import * as React from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { DashboardBreadcrumb } from "@/components/dashboard/breadcrumb"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar collapsible="icon" />
        <div className="flex-1 w-full p-6">
          <div className="flex items-center w-full justify-between gap-4 mb-4">
            <SidebarTrigger />
            <DashboardBreadcrumb />
          </div>
          <div className="w-full">
            {children}
          </div>
        </div>
      </div>
    </SidebarProvider>
  )
} 