"use client"

import type { Image as ImageType } from "~/lib/types"
import { useState } from "react"
import Image from "next/image"
import { MessageSquare } from "lucide-react"
import { Badge } from "~/components/ui/badge"

interface ClientImageCardProps {
  image: ImageType
  onImageClick: (image: ImageType) => void
}

export function ClientImageCard({ image, onImageClick }: ClientImageCardProps) {
  const [markedForDeletion] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  // For now, we'll use a placeholder comment count since we haven't implemented comments yet
  const commentCount = 0

  return (
    <div className={`overflow-hidden py-0 ${markedForDeletion ? "opacity-60" : ""}`}>
      <div
        className={`relative aspect-square cursor-pointer ${isHovered ? "opacity-80" : ""}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => onImageClick(image)}
      >
        <Image
          src={image.watermarkedUrl ?? "/placeholder.svg"}
          alt={image.caption ?? "Album photo"}
          fill
          className="object-contain p-3 bg-stone-100"
        />
        {!image.watermarkedUrl && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-white text-opacity-30 text-xl font-bold rotate-[-45deg] select-none">WATERMARK</div>
          </div>
        )}
        {markedForDeletion && (
          <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
            <span className="text-white text-xs font-semibold px-2 py-1 bg-red-500 rounded-md">Delete</span>
          </div>
        )}
        {commentCount > 0 && (
          <div className="absolute top-1 right-1">
            <Badge variant="secondary" className="flex items-center gap-1 text-xs py-0 px-1.5">
              <MessageSquare className="h-2.5 w-2.5" />
              {commentCount}
            </Badge>
          </div>
        )}
      </div>

      <div className="pt-1 grid grid-cols-5">
        <div className="col-span-3 col-start-2">
          <p className="text-xs truncate text-center">{image.caption ?? "Untitled"}</p>
        </div>
      </div>
    </div>
  )
}

