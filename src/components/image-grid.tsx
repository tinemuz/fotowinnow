"use client"

import type { Image as ImageType } from "~/lib/types"
import type { Album } from "~/lib/types"
import NextImage from "next/image"
import { MoreHorizontal } from "lucide-react"
import { Button } from "~/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "~/components/ui/dropdown-menu"
import { useState } from "react"
import { updateAlbumSettings, fetchAlbumById } from "~/lib/api"

interface ImageGridProps {
  images: ImageType[]
  watermarked: boolean
  clientView?: boolean
  onImageClick: (image: ImageType) => void
  albumId: number
  onAlbumUpdate?: (album: Album) => void
  album: { coverImage: string }
}

export function ImageGrid({ images, watermarked, clientView = false, onImageClick, albumId, onAlbumUpdate, album }: ImageGridProps) {
  const [openMenuId, setOpenMenuId] = useState<number | null>(null)

  const handleSetAsCover = async (image: ImageType) => {
    try {
      // Check if the current cover image is from an album image
      const isCurrentCoverFromAlbum = images.some(img => 
        img.optimizedUrl === album.coverImage || img.watermarkedUrl === album.coverImage
      );

      // If the current cover is not from an album image, we should delete it
      if (!isCurrentCoverFromAlbum && album.coverImage && !album.coverImage.startsWith('/cover/')) {
        try {
          // Extract the key from the URL
          const key = album.coverImage.split('/').pop();
          if (key) {
            // Delete the image object
            await fetch('/api/images/' + key, {
              method: 'DELETE',
            });
          }
        } catch (error) {
          console.error("Failed to delete old cover image:", error);
          // Continue with updating even if deletion fails
        }
      }

      // First fetch current album settings
      const currentAlbum = await fetchAlbumById(albumId);

      // Update the album with the new cover image while preserving other settings
      const updatedAlbum = await updateAlbumSettings(albumId, {
        title: currentAlbum.title,
        description: currentAlbum.description ?? "",
        watermarkText: currentAlbum.watermarkText ?? "",
        watermarkQuality: currentAlbum.watermarkQuality ?? "1080p",
        watermarkOpacity: currentAlbum.watermarkOpacity ?? 50,
        coverImage: image.optimizedUrl
      });
      onAlbumUpdate?.(updatedAlbum);
    } catch (error) {
      console.error("Failed to update cover image:", error);
    }
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
      {images.map((image) => (
        <div key={image.id} className="overflow-hidden py-0">
          <div className="relative aspect-square cursor-pointer group" onClick={() => onImageClick(image)}>
            <NextImage
              src={watermarked ? (image.watermarkedUrl ?? "/placeholder.svg") : (image.optimizedUrl ?? "/placeholder.svg")}
              alt={image.caption ?? "Album photo"}
              fill
              className="object-contain p-3 bg-stone-100"
            />

            {!clientView && (
              <div className={`absolute top-2 right-2 z-10 transition-opacity ${openMenuId === image.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} onClick={(e) => e.stopPropagation()}>
                <DropdownMenu open={openMenuId === image.id} onOpenChange={(open) => setOpenMenuId(open ? image.id : null)}>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6 bg-white/70 backdrop-blur-sm shadow">
                      <MoreHorizontal className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => handleSetAsCover(image)}>Set as Cover Image</DropdownMenuItem>
                    <DropdownMenuItem>Edit Caption</DropdownMenuItem>
                    <DropdownMenuItem>Replace</DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>

          <div className="pt-1 grid grid-cols-5">
            <div className="col-span-3 col-start-2">
              <p className="text-xs truncate text-center">{image.caption ?? "Untitled"}</p>
            </div>
          </div>

        </div>
      ))}
    </div>
  )
}

