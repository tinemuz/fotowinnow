"use client"

import { usePathname } from "next/navigation"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

export function DashboardBreadcrumb() {
  const pathname = usePathname()
  const pathSegments = pathname.split('/').filter(segment => segment)
  
  const breadcrumbs = [
    <BreadcrumbItem key="home">
      <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
    </BreadcrumbItem>
  ]

  if (pathSegments.length > 1 && pathSegments[0] === 'dashboard') {
    breadcrumbs.push(<BreadcrumbSeparator key="sep-1" />)
    if (pathSegments[1] === 'albums') {
      breadcrumbs.push(
        <BreadcrumbItem key="albums">
          {pathSegments.length === 2 ? (
            <BreadcrumbPage>Albums</BreadcrumbPage>
          ) : (
            <BreadcrumbLink href="/dashboard/albums">Albums</BreadcrumbLink>
          )}
        </BreadcrumbItem>
      )
    }
    if (pathSegments[1] === 'albums' && pathSegments.length > 2) {
      breadcrumbs.push(<BreadcrumbSeparator key="sep-2" />)
      breadcrumbs.push(
        <BreadcrumbItem key="album-detail">
          <BreadcrumbPage>Album</BreadcrumbPage>
        </BreadcrumbItem>
      )
    }
  }

  return (
    <Breadcrumb className="hidden md:flex flex-1">
      <BreadcrumbList>{breadcrumbs}</BreadcrumbList>
    </Breadcrumb>
  )
} 