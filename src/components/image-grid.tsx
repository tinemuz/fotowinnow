"use client"

import type { Image as ImageType } from "~/lib/types"
import NextImage from "next/image"
import { MoreHorizontal } from "lucide-react"
import { Button } from "~/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "~/components/ui/dropdown-menu"

interface ImageGridProps {
  images: ImageType[]
  watermarked: boolean
  clientView?: boolean
  onImageClick: (image: ImageType) => void
}

export function ImageGrid({ images, watermarked, clientView = false, onImageClick }: ImageGridProps) {
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
              <div className="absolute top-2 right-2 z-10" onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6 bg-white/70 backdrop-blur-sm shadow">
                      <MoreHorizontal className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
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

