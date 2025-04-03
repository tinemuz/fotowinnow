"use client"

import { Photo } from "@/lib/actions/photos"
import { Card, CardContent } from "@/components/ui/card"
import Image from "next/image"

interface AlbumPhotosProps {
  photos: Photo[]
}

export function AlbumPhotos({ photos }: AlbumPhotosProps) {
  if (photos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-muted-foreground">No photos in this album yet</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {photos.map((photo) => (
        <Card key={photo.id} className="overflow-hidden">
          <CardContent className="p-0">
            <div className="relative aspect-square">
              <Image
                src={`/api/photos/${photo.storage_path_original}`}
                alt={photo.filename_original}
                fill
                className="object-cover"
              />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
} 