import { AlbumCard } from "~/components/album-card"
import { Button } from "~/components/ui/button"
import { PlusCircle } from "lucide-react"
import { mockAlbums } from "~/lib/data"
import { Breadcrumbs } from "~/components/breadcrumbs"

export default function Dashboard() {
  return (
    <div className="container py-10 space-y-8">
      <Breadcrumbs items={[{ label: "Dashboard" }]} />

      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Your Albums</h1>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Create New Album
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockAlbums.map((album) => (
          <AlbumCard key={album.id} album={album} />
        ))}
      </div>
    </div>
  )
}

