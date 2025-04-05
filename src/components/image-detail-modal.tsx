"use client"

import { Dialog, DialogContent } from "~/components/ui/dialog"
import { Button } from "~/components/ui/button"
import { Textarea } from "~/components/ui/textarea"
import { type Image as ImageType, type Comment as CommentType, mockComments } from "~/lib/data"
import Image from "next/image"
import { ChevronLeft, ChevronRight, MessageSquare, Trash2} from "lucide-react"
import { useState, useEffect, useCallback } from "react"
import { ScrollArea } from "~/components/ui/scroll-area"

interface ImageDetailModalProps {
  image: ImageType | null
  images: ImageType[]
  isOpen: boolean
  onClose: () => void
  watermarked: boolean
  isClientView?: boolean
  onNavigate: (image: ImageType) => void
}

export function ImageDetailModal({
  image,
  images,
  isOpen,
  onClose,
  watermarked,
  isClientView = false,
  onNavigate,
}: ImageDetailModalProps) {
  const [newComment, setNewComment] = useState("")
  const [comments, setComments] = useState<CommentType[]>([])
  const [markedForDeletion, setMarkedForDeletion] = useState(false)
  const [isAddingComment, setIsAddingComment] = useState(false)

  useEffect(() => {
    if (image) {
      // In a real app, you would fetch comments from an API
      const imageComments = mockComments.filter((comment) => comment.imageId === image.id)
      setComments(imageComments)
      setMarkedForDeletion(false)
    }
  }, [image])

  const handleAddComment = () => {
    if (newComment.trim() && image) {
      const newCommentObj: CommentType = {
        id: `comment-${Date.now()}`,
        imageId: image.id,
        text: newComment,
        author: isClientView ? "Client" : "Photographer",
        createdAt: new Date().toISOString(),
      }

      setComments([...comments, newCommentObj])
      setNewComment("")
      setIsAddingComment(false)
    }
  }

  const navigateToImage = useCallback(
    (direction: "prev" | "next") => {
      if (!image || images.length <= 1) return

      const currentIndex = images.findIndex((img) => img.id === image.id)
      if (currentIndex === -1) return

      let newIndex
      if (direction === "prev") {
        newIndex = currentIndex === 0 ? images.length - 1 : currentIndex - 1
      } else {
        newIndex = currentIndex === images.length - 1 ? 0 : currentIndex + 1
      }

      const nextImage = images[newIndex]
      if (!nextImage) return
      onNavigate(nextImage)
    },
    [image, images, onNavigate],
  )

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return

      if (e.key === "ArrowLeft") {
        navigateToImage("prev")
      } else if (e.key === "ArrowRight") {
        navigateToImage("next")
      } else if (e.key === "Escape") {
        onClose()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, navigateToImage, onClose])

  if (!image) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        <div className="flex flex-col h-full">
          {/* Image Section - Fixed height */}
          <div className="relative w-full h-[50vh] min-h-[400px] flex-shrink-0 flex items-center justify-center">
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-black/20 hover:bg-black/40 text-white rounded-full h-10 w-10"
              onClick={() => navigateToImage("prev")}
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-black/20 hover:bg-black/40 text-white rounded-full h-10 w-10"
              onClick={() => navigateToImage("next")}
            >
              <ChevronRight className="h-6 w-6" />
            </Button>

            <div className={`relative h-full w-full ${markedForDeletion ? "opacity-60" : ""}`}>
              <Image
                src={image.url ?? "/placeholder.svg"}
                alt={image.caption ?? "Image"}
                fill
                className="object-contain"
              />
              {watermarked && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-white text-opacity-30 text-3xl font-bold rotate-[-45deg] select-none">
                    WATERMARK
                  </div>
                </div>
              )}
              {markedForDeletion && (
                <div className="absolute inset-0 bg-opacity-40 flex items-center justify-center">
                  <span className="text-white font-semibold px-3 py-1 bg-red-500 rounded-md">Marked for Deletion</span>
                </div>
              )}
            </div>
          </div>

          {/* Comments Section */}
          <div className="flex flex-col h-[40vh] min-h-[300px] border-t">
            <div className="p-4 border-b">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-base font-medium">Comments</h3>
                {isClientView && (
                  <Button
                    variant="outline"
                    size="sm"
                    className={markedForDeletion ? "bg-red-100" : ""}
                    onClick={() => setMarkedForDeletion(!markedForDeletion)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    {markedForDeletion ? "Undo" : "Delete"}
                  </Button>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{image.caption ?? "Untitled"}</p>
            </div>

            <div className="flex-1 overflow-hidden">
              <ScrollArea className="h-full p-4">
                {comments.length > 0 ? (
                  <div className="space-y-4">
                    {comments.map((comment) => (
                      <div key={comment.id} className="text-sm border-b pb-3">
                        <div className="flex justify-between mb-1">
                          <span className="font-medium">{comment.author}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(comment.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm">{comment.text}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-6">No comments yet</p>
                )}
              </ScrollArea>
            </div>

            <div className="p-4 border-t">
              {isAddingComment ? (
                <div className="space-y-3">
                  <Textarea
                    placeholder="Add your comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="min-h-[100px] text-sm"
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setIsAddingComment(false)
                        setNewComment("")
                      }}
                    >
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleAddComment}>
                      Add
                    </Button>
                  </div>
                </div>
              ) : (
                <Button variant="outline" className="w-full text-sm" size="sm" onClick={() => setIsAddingComment(true)}>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Add Comment
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

