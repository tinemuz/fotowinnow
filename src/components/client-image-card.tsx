"use client"

import { Card, CardContent, CardFooter } from "~/components/ui/card"
import { type Image as ImageType, mockComments } from "~/lib/data"
import Image from "next/image"
import { Button } from "~/components/ui/button"
import { MessageSquare, Trash2 } from "lucide-react"
import { useState, useEffect } from "react"
import { Badge } from "~/components/ui/badge"

interface ClientImageCardProps {
  image: ImageType
  onImageClick: (image: ImageType) => void
}

export function ClientImageCard({ image, onImageClick }: ClientImageCardProps) {
  const [markedForDeletion, setMarkedForDeletion] = useState(false)
  const [commentCount, setCommentCount] = useState(0)

  useEffect(() => {
    // In a real app, you would fetch this from an API
    const imageComments = mockComments.filter((comment) => comment.imageId === image.id)
    setCommentCount(imageComments.length)
  }, [image.id])

  return (
    <Card className={`overflow-hidden ${markedForDeletion ? "opacity-60" : ""}`}>
      <div className="relative aspect-square cursor-pointer" onClick={() => onImageClick(image)}>
        <Image
          src={image.url || "/placeholder.svg"}
          alt={image.caption || "Album photo"}
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-white text-opacity-30 text-xl font-bold rotate-[-45deg] select-none">WATERMARK</div>
        </div>
        {markedForDeletion && (
          <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
            <span className="text-white font-semibold px-3 py-1 bg-red-500 rounded-md">Marked for Deletion</span>
          </div>
        )}
        {commentCount > 0 && (
          <div className="absolute top-2 right-2">
            <Badge variant="secondary" className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              {commentCount}
            </Badge>
          </div>
        )}
      </div>
      <CardContent className="p-3">
        <p className="text-sm truncate">{image.caption || "Untitled"}</p>
      </CardContent>
      <CardFooter className="flex justify-between p-3 pt-0">
        <Button variant="outline" size="sm" onClick={() => onImageClick(image)}>
          <MessageSquare className="h-4 w-4 mr-1" />
          {commentCount > 0 ? `View Comments (${commentCount})` : "Add Comment"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className={markedForDeletion ? "bg-red-100" : ""}
          onClick={() => setMarkedForDeletion(!markedForDeletion)}
        >
          <Trash2 className="h-4 w-4 mr-1" />
          {markedForDeletion ? "Undo" : "Mark for Deletion"}
        </Button>
      </CardFooter>
    </Card>
  )
}

