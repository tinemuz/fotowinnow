"use client"

import * as React from "react"
import { usePathname } from "next/navigation"

import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname()

  const generateBreadcrumbs = () => {
    const pathSegments = pathname.split('/').filter(segment => segment);
    const breadcrumbs = [
      <BreadcrumbItem key="home">
        <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
      </BreadcrumbItem>
    ];

    if (pathSegments.length > 1 && pathSegments[0] === 'dashboard') {
        breadcrumbs.push(<BreadcrumbSeparator key="sep-1" />);
        if (pathSegments[1] === 'albums') {
             breadcrumbs.push(
                <BreadcrumbItem key="albums">
                   {pathSegments.length === 2 ? (
                       <BreadcrumbPage>Albums</BreadcrumbPage>
                   ) : (
                       <BreadcrumbLink href="/dashboard/albums">Albums</BreadcrumbLink>
                   )}
                </BreadcrumbItem>
             );
        }
        if (pathSegments[1] === 'albums' && pathSegments.length > 2) {
            breadcrumbs.push(<BreadcrumbSeparator key="sep-2" />);
            breadcrumbs.push(
                <BreadcrumbItem key="album-detail">
                    <BreadcrumbPage>{pathSegments[2]}</BreadcrumbPage>
                </BreadcrumbItem>
            );
        }
    }

    return breadcrumbs;
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar collapsible="icon" />
        <div className="flex-1 w-full p-6">
          <div className="flex items-center w-full justify-between gap-4 mb-4">
            <SidebarTrigger />
            <Breadcrumb className="hidden md:flex flex-1">
              <BreadcrumbList>{generateBreadcrumbs()}</BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="w-full">
            {children}
          </div>
        </div>
      </div>
    </SidebarProvider>
  )
} 