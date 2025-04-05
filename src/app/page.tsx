"use client"

import { AlbumCard } from "~/components/album-card"
import { Button } from "~/components/ui/button"
import { PlusCircle } from "lucide-react"
import { mockAlbums } from "~/lib/data"
import { useState } from "react"
import { NewAlbumModal } from "~/components/new-album-modal"
import { useRouter } from "next/navigation"

export default function Dashboard() {
  const [isNewAlbumModalOpen, setIsNewAlbumModalOpen] = useState(false)
  const [albums, setAlbums] = useState(mockAlbums)
  const router = useRouter()

  const handleCreateAlbum = (title: string, description: string) => {
    const newAlbum = {
      id: `album-${Date.now()}`,
      title,
      description,
      coverImage: "",
      createdAt: new Date().toISOString(),
      isShared: false,
      imageCount: 0,
      photographerName: "Jane Smith Photography",
    }

    setAlbums([newAlbum, ...albums])

    // Navigate to the new album
    router.push(`/albums/${newAlbum.id}`)
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {albums.map((album) => (
          <AlbumCard key={album.id} album={album} />
        ))}
      </div>

      <NewAlbumModal
        isOpen={isNewAlbumModalOpen}
        onClose={() => setIsNewAlbumModalOpen(false)}
        onCreateAlbum={handleCreateAlbum}
      />
    </div>
  )
}

