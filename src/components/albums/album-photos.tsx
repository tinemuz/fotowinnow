"use client"

import { Photo } from "@/lib/actions/photos"
import { Card, CardContent } from "@/components/ui/card"
import Image from "next/image"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { IconAlertCircle } from "@tabler/icons-react"

interface AlbumPhotosProps {
  photos: Photo[]
  isLoading?: boolean
  error?: string
}

export function AlbumPhotos({ photos, isLoading, error }: AlbumPhotosProps) {
  if (error) {
    return (
      <Alert variant="destructive">
        <IconAlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <CardContent className="p-0">
              <Skeleton className="aspect-square w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

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
        <Card key={photo.id} className="overflow-hidden group">
          <CardContent className="p-0">
            <div className="relative aspect-square">
              <Image
                src={`/api/photos/${encodeURIComponent(photo.storage_path_original)}`}
                alt={photo.filename_original}
                fill
                className="object-cover transition-transform group-hover:scale-105"
                sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                priority={false}
              />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
} 