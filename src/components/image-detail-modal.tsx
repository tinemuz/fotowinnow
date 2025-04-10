"use client"

import { Button } from "~/components/ui/button"
import { Textarea } from "~/components/ui/textarea"
import { type Image as ImageType, type Comment } from "~/lib/types"
import NextImage from "next/image"
import { ChevronLeft, ChevronRight, MessageSquare, Trash2, X } from "lucide-react"
import { useState, useEffect, useCallback, useRef } from "react"
import { ScrollArea } from "~/components/ui/scroll-area"
import { fetchImageComments, createComment } from "~/lib/api"

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
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [newComment, setNewComment] = useState("")
  const [comments, setComments] = useState<Comment[]>([])
  const [markedForDeletion, setMarkedForDeletion] = useState(false)
  const [isAddingComment, setIsAddingComment] = useState(false)
  const [isLoadingComments, setIsLoadingComments] = useState(false)
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (isOpen) {
      dialog.showModal()
    } else {
      dialog.close()
    }
  }, [isOpen])

  useEffect(() => {
    const loadComments = async () => {
      if (!image) return
      
      try {
        setIsLoadingComments(true)
        setComments([]) // Reset comments when loading new image
        const imageComments = await fetchImageComments(image.id)
        console.log('Loading comments for image:', image.id)
        console.log('Loaded comments:', imageComments)
        setComments(imageComments)
      } catch (error) {
        console.error("Failed to load comments:", error)
      } finally {
        setIsLoadingComments(false)
      }
    }

    void loadComments()
    setMarkedForDeletion(false)
    setNewComment("") // Reset new comment input when image changes
    setIsAddingComment(false) // Close comment input when image changes
  }, [image])

  const handleAddComment = async () => {
    if (!newComment.trim() || !image) return

    try {
      setIsSubmittingComment(true)
      const newCommentObj = await createComment(image.id, {
        text: newComment,
        author: isClientView ? "Client" : "Photographer",
      })

      setComments([...comments, newCommentObj])
      setNewComment("")
      setIsAddingComment(false)
    } catch (error) {
      console.error("Failed to add comment:", error)
    } finally {
      setIsSubmittingComment(false)
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
    <dialog
      ref={dialogRef}
      className="w-screen h-screen p-0 m-0 bg-transparent backdrop:bg-black/80"
      onClose={onClose}
    >
      <div className="w-full h-full">
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 top-4 z-50 bg-black/20 hover:bg-black/40 text-white rounded-full"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>

        <div className="flex h-full">
          {/* Image Section */}
          <div className="relative flex-1 h-full flex items-center justify-center bg-white">
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
              <NextImage
                src={watermarked ? (image.watermarkedUrl ?? "/placeholder.svg") : (image.optimizedUrl ?? "/placeholder.svg")}
                alt={image.caption ?? "Image"}
                fill
                className="object-contain p-18"
              />
              {watermarked && !image.watermarkedUrl && (
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

          {/* Comments Section - Fixed width sidebar */}
          <div className="w-[400px] flex flex-col h-full bg-white">
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
                {isLoadingComments ? (
                  <p className="text-sm text-muted-foreground text-center py-6">Loading comments...</p>
                ) : comments.length > 0 ? (
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
                    <Button variant="outline" size="sm" onClick={() => setIsAddingComment(false)}>
                      Cancel
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={handleAddComment}
                      disabled={isSubmittingComment || !newComment.trim()}
                    >
                      {isSubmittingComment ? "Adding..." : "Add Comment"}
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setIsAddingComment(true)}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Add Comment
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </dialog>
  )
}

