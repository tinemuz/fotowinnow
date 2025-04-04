import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card"
import {IconAlbum, IconClockHour4, IconFileSearch, IconFileUpload, IconPhoto,} from "@tabler/icons-react"
import { getAlbumStats } from "@/lib/actions/albums"

export default async function DashboardPage() {
  const stats = await getAlbumStats();

  return (
    <div className="flex flex-col w-full gap-4 py-4 md:gap-6 md:py-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-2 w-full md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        <Card className="">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium truncate">Draft Albums</CardTitle>
            <IconAlbum className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.draftCount}</div>
          </CardContent>
        </Card>
        <Card className="">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium truncate">
              Published Albums
            </CardTitle>
            <IconFileUpload className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.publishedCount}</div>
          </CardContent>
        </Card>
        <Card className="min-w-[180px] min-h-[120px]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium truncate">
              Archived Albums
            </CardTitle>
            <IconFileSearch className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.archivedCount}</div>
          </CardContent>
        </Card>
        <Card className="min-w-[180px] min-h-[120px]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium truncate">
              Processing Albums
            </CardTitle>
            <IconClockHour4 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
          </CardContent>
        </Card>
        <Card className="min-w-[180px] min-h-[120px]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium truncate">Total Photos</CardTitle>
            <IconPhoto className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPhotos}</div>
          </CardContent>
        </Card>
      </div>
      {/* Add more dashboard components here as needed */}
    </div>
  )
}
