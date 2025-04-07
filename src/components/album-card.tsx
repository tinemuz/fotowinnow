"use client"

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "~/components/ui/card"
import { Button } from "~/components/ui/button"
import { Share2, Lock } from "lucide-react"
import type { Album } from "~/lib/types"
import { useRouter } from "next/navigation"
import Image from "next/image"

interface AlbumCardProps {
  album: Album
}

export function AlbumCard({ album }: AlbumCardProps) {
  const router = useRouter()

  const handleViewAlbum = () => {
    router.push(`/albums/${album.id}`)
  }

  return (
    <Card className="overflow-hidden">
      <div
        className="relative aspect-video w-full cursor-pointer bg-muted"
        onClick={handleViewAlbum}
      >
        {album.coverImage ? (
          <Image
            src={album.coverImage}
            alt={album.title}
            fill
            style={{ objectFit: "cover" }}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="text-muted-foreground">No cover image</p>
          </div>
        )}
      </div>

      <CardHeader>
        <CardTitle className="line-clamp-1">{album.title}</CardTitle>
      </CardHeader>

      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {album.description ?? "No description"}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          By {album.photographerName ?? "Unknown photographer"}
        </p>
      </CardContent>

      <CardFooter className="flex justify-between">
        <Button variant="ghost" size="sm">
          {album.isShared ? (
            <>
              <Share2 className="mr-2 h-4 w-4" />
              Shared
            </>
          ) : (
            <>
              <Lock className="mr-2 h-4 w-4" />
              Private
            </>
          )}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleViewAlbum}
        >
          View Album
        </Button>
      </CardFooter>
    </Card>
  )
}

