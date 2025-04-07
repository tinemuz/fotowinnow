"use client"

import { useEffect, useState } from "react"
import { AlbumCard } from "~/components/album-card"
import { Button } from "~/components/ui/button"
import { PlusCircle } from "lucide-react"
import { NewAlbumModal } from "~/components/new-album-modal"
// import { useRouter } from "next/navigation"
import { fetchAlbums } from "~/lib/api"
import type { Album } from "~/lib/types"

export default function Dashboard() {
  const [isNewAlbumModalOpen, setIsNewAlbumModalOpen] = useState(false)
  const [albums, setAlbums] = useState<Album[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // const router = useRouter()

  const loadAlbums = async () => {
    try {
      const data = await fetchAlbums()
      setAlbums(data)
      setError(null)
    } catch (err) {
      console.error("Error loading albums:", err)
      setError("Failed to load albums")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadAlbums()
  }, [])

  const handleAlbumCreated = () => {
    void loadAlbums()
  }

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center">
          <p>Loading albums...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center">
          <p className="text-red-500">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Your Albums</h1>
        <Button onClick={() => setIsNewAlbumModalOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          New Album
        </Button>
      </div>

      {albums.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">No albums yet. Create your first album!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {albums.map((album) => (
            <AlbumCard key={album.id} album={album} />
          ))}
        </div>
      )}

      <NewAlbumModal
        isOpen={isNewAlbumModalOpen}
        onClose={() => setIsNewAlbumModalOpen(false)}
        onAlbumCreated={handleAlbumCreated}
      />
    </div>
  )
}

