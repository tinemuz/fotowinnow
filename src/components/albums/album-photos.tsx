"use client"

import { Photo } from "@/lib/actions/photos"
import Image from "next/image"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { IconAlertCircle } from "@tabler/icons-react"
import { useState } from "react"

interface AlbumPhotosProps {
  photos: Photo[]
  isLoading?: boolean
  error?: string
}

export function AlbumPhotos({ photos, isLoading, error }: AlbumPhotosProps) {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set())

  const handleImageLoad = (photoId: string) => {
    setLoadedImages(prev => {
      const newSet = new Set(prev)
      newSet.add(photoId)
      return newSet
    })
  }

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
          <div key={i} className="relative aspect-square rounded-sm overflow-hidden">
            <Skeleton className="absolute inset-0" />
          </div>
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
        <div key={photo.id} className="relative aspect-square rounded-sm overflow-hidden">
          {!loadedImages.has(photo.id) && (
            <Skeleton className="absolute inset-0" />
          )}
          <Image
            src={`/api/photos/${encodeURIComponent(photo.storage_path_original)}`}
            alt={photo.filename_original}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            priority={false}
            unoptimized
            onLoadingComplete={() => handleImageLoad(photo.id)}
          />
        </div>
      ))}
    </div>
  )
} 