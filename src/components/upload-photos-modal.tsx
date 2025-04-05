"use client"

import type React from "react"

import { Button } from "~/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "~/components/ui/dialog"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { ImagePlus, X } from "lucide-react"
import { useState, useRef } from "react"
import Image from "next/image"

interface UploadPhotosModalProps {
  isOpen: boolean
  onClose: () => void
  _albumId: string
  onUploadPhotos: (files: File[]) => void
}

export function UploadPhotosModal({ isOpen, onClose, _albumId, onUploadPhotos }: UploadPhotosModalProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return

    const files = Array.from(e.target.files)
    setSelectedFiles((prev) => [...prev, ...files])

    // Create previews
    const newPreviews = files.map((file) => URL.createObjectURL(file))
    setPreviews((prev) => [...prev, ...newPreviews])
  }

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
    // Revoke the object URL to avoid memory leaks
    if (previews[index]) {
      URL.revokeObjectURL(previews[index])
    }
    setPreviews((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedFiles.length === 0) return

    setIsUploading(true)

    // Simulate API call
    setTimeout(() => {
      onUploadPhotos(selectedFiles)

      // Clean up previews
      previews.forEach((preview) => URL.revokeObjectURL(preview))

      setSelectedFiles([])
      setPreviews([])
      setIsUploading(false)
      onClose()
    }, 1000)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Upload Photos</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div
            className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <ImagePlus className="h-8 w-8 mx-auto text-muted-foreground" />
            <p className="mt-2 text-sm font-medium">Click to select photos or drag and drop</p>
            <p className="text-xs text-muted-foreground mt-1">JPG, PNG or WEBP (max. 10MB each)</p>
            <Input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileChange}
              disabled={isUploading}
            />
          </div>

          {previews.length > 0 && (
            <div className="space-y-2">
              <Label>Selected Photos ({previews.length})</Label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {previews.map((preview, index) => (
                  <div key={index} className="relative aspect-square rounded-md overflow-hidden border">
                    <Image
                      src={preview || "/placeholder.svg"}
                      alt={`Preview ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 h-5 w-5 rounded-full"
                      onClick={(e) => {
                        e.stopPropagation()
                        removeFile(index)
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isUploading}>
              Cancel
            </Button>
            <Button type="submit" disabled={selectedFiles.length === 0 || isUploading}>
              {isUploading ? "Uploading..." : "Upload Photos"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

