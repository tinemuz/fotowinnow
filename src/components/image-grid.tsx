"use client"

import { Card, CardContent } from "~/components/ui/card"
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
        <Card key={image.id} className="overflow-hidden py-0">
          <div className="relative aspect-square cursor-pointer" onClick={() => onImageClick(image)}>
            <NextImage
              src={watermarked ? (image.watermarkedUrl ?? "/placeholder.svg") : (image.optimizedUrl ?? "/placeholder.svg")}
              alt={image.caption ?? "Album photo"}
              fill
              className="object-cover"
            />
            {watermarked && !image.watermarkedUrl && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-white text-opacity-30 text-xl font-bold rotate-[-45deg] select-none">
                  WATERMARK
                </div>
              </div>
            )}
          </div>
          <CardContent className="p-2 pt-0">
            <div className="flex justify-between items-center">
              <p className="text-xs truncate">{image.caption ?? "Untitled"}</p>
              {!clientView && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <MoreHorizontal className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>Edit Caption</DropdownMenuItem>
                    <DropdownMenuItem>Replace</DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

