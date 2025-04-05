"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog"
import { Button } from "~/components/ui/button"
import { Textarea } from "~/components/ui/textarea"
import { type Image as ImageType, type Comment as CommentType, mockComments } from "~/lib/data"
import Image from "next/image"
import { ChevronLeft, ChevronRight, MessageSquare, Trash2, X } from "lucide-react"
import { useState, useEffect } from "react"
import { CommentList } from "./comment-list"
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
        author: "Client",
        createdAt: new Date().toISOString(),
      }

      setComments([...comments, newCommentObj])
      setNewComment("")
      setIsAddingComment(false)
    }
  }

  const navigateToImage = (direction: "prev" | "next") => {
    if (!image || images.length <= 1) return

    const currentIndex = images.findIndex((img) => img.id === image.id)
    if (currentIndex === -1) return

    let newIndex
    if (direction === "prev") {
      newIndex = currentIndex === 0 ? images.length - 1 : currentIndex - 1
    } else {
      newIndex = currentIndex === images.length - 1 ? 0 : currentIndex + 1
    }

    onNavigate(images[newIndex])
  }

  if (!image) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-4 pb-2">
          <div className="flex items-center justify-between">
            <DialogTitle>{image.caption || "Image Detail"}</DialogTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex flex-col md:flex-row h-full overflow-hidden">
          {/* Image Section */}
          <div className="relative w-full md:w-2/3 h-[300px] md:h-full">
            {/* Navigation Arrows */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-black/20 hover:bg-black/40 text-white rounded-full h-8 w-8"
              onClick={() => navigateToImage("prev")}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-black/20 hover:bg-black/40 text-white rounded-full h-8 w-8"
              onClick={() => navigateToImage("next")}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>

            <div className={`relative h-full ${markedForDeletion ? "opacity-60" : ""}`}>
              <Image
                src={image.url || "/placeholder.svg"}
                alt={image.caption || "Image"}
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
                <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                  <span className="text-white font-semibold px-3 py-1 bg-red-500 rounded-md">Marked for Deletion</span>
                </div>
              )}
            </div>
          </div>

          {/* Comments Section */}
          <div className="w-full md:w-1/3 p-4 flex flex-col border-t md:border-t-0 md:border-l">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium">Comments</h3>
              {isClientView && (
                <Button
                  variant="outline"
                  size="sm"
                  className={markedForDeletion ? "bg-red-100" : ""}
                  onClick={() => setMarkedForDeletion(!markedForDeletion)}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  {markedForDeletion ? "Undo" : "Mark for Deletion"}
                </Button>
              )}
            </div>

            <ScrollArea className="flex-grow">
              {comments.length > 0 ? (
                <CommentList comments={comments} />
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No comments yet</p>
              )}
            </ScrollArea>

            {isClientView && (
              <div className="mt-4">
                {isAddingComment ? (
                  <div className="space-y-2">
                    <Textarea
                      placeholder="Add your comment..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="min-h-[100px]"
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
                        Add Comment
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button variant="outline" className="w-full" onClick={() => setIsAddingComment(true)}>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Add Comment
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

