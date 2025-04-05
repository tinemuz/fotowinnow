"use client"

import { Card, CardContent } from "~/components/ui/card"
import type { Image as ImageType } from "~/lib/data"
import Image from "next/image"
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
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {images.map((image) => (
        <Card key={image.id} className="overflow-hidden">
          <div className="relative aspect-square cursor-pointer" onClick={() => onImageClick(image)}>
            <Image
              src={image.url || "/placeholder.svg"}
              alt={image.caption || "Album photo"}
              fill
              className="object-cover"
            />
            {watermarked && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-white text-opacity-30 text-xl font-bold rotate-[-45deg] select-none">
                  WATERMARK
                </div>
              </div>
            )}
          </div>
          <CardContent className="p-3">
            <div className="flex justify-between items-center">
              <p className="text-sm truncate">{image.caption || "Untitled"}</p>
              {!clientView ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>Edit Caption</DropdownMenuItem>
                    <DropdownMenuItem>Replace Image</DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : null}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

