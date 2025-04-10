"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Button } from "~/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "~/components/ui/dialog"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { Textarea } from "~/components/ui/textarea"
import { Slider } from "~/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select"
import type { Album } from "~/lib/types"
import { ImagePlus } from "lucide-react"
import Image from "next/image"

interface AlbumSettingsModalProps {
  isOpen: boolean
  onClose: () => void
  album: Album
  onSave: (settings: {
    title: string
    description: string
    watermarkText: string
    watermarkQuality: "512p" | "1080p" | "2K" | "4K"
    watermarkOpacity: number
    coverImage?: File
  }, onProgress?: (status: string, progress?: number) => void) => Promise<void>
}

const QUALITY_OPTIONS = ["512p", "1080p", "2K", "4K"] as const;

export function AlbumSettingsModal({ isOpen, onClose, album, onSave }: AlbumSettingsModalProps) {
  const [title, setTitle] = useState(album.title)
  const [description, setDescription] = useState(album.description ?? "")
  const [watermarkText, setWatermarkText] = useState(album.watermarkText ?? "fotowinnow")
  const [watermarkQuality, setWatermarkQuality] = useState<"512p" | "1080p" | "2K" | "4K">(album.watermarkQuality ?? "1080p")
  const [watermarkOpacity, setWatermarkOpacity] = useState(album.watermarkOpacity ?? 10)
  const [coverImage, setCoverImage] = useState<File | null>(null)
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadStatus, setUploadStatus] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    if (!file.type.startsWith('image/')) {
      setError("Please select an image file");
      return;
    }
    
    setCoverImage(file);
    const preview = URL.createObjectURL(file);
    setCoverImagePreview(preview);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setIsSubmitting(true)
    setError(null)

    try {
      await onSave({
        title,
        description,
        watermarkText,
        watermarkQuality,
        watermarkOpacity,
        ...(coverImage && { coverImage })
      }, (status: string, progress?: number) => {
        setUploadStatus(status);
        if (progress !== undefined) {
          setUploadProgress(progress);
        } else {
          setUploadProgress(null);
        }
      })
      onClose()
    } catch (err) {
      console.error("Error updating album settings:", err)
      setError("Failed to update album settings")
    } finally {
      setIsSubmitting(false)
      setUploadStatus(null)
      setUploadProgress(null)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Album Settings</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Cover Image</Label>
            <div 
              className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-muted/50 transition-colors relative"
              onClick={() => fileInputRef.current?.click()}
            >
              {coverImagePreview || album.coverImage ? (
                <div className="relative aspect-4/3 w-full">
                  <Image
                    src={coverImagePreview || album.coverImage}
                    alt="Album cover"
                    fill
                    className="object-cover rounded-md"
                  />
                </div>
              ) : (
                <>
                  <ImagePlus className="h-8 w-8 mx-auto text-muted-foreground" />
                  <p className="mt-2 text-sm font-medium">Click to select a cover image</p>
                  <p className="text-xs text-muted-foreground mt-1">JPG, PNG or WEBP</p>
                </>
              )}
              <Input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleCoverImageChange}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Album Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter album title"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter album description (optional)"
              className="resize-none"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="watermark-text">Watermark Text</Label>
            <Input
              id="watermark-text"
              value={watermarkText}
              onChange={(e) => setWatermarkText(e.target.value)}
              placeholder="Enter watermark text"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="watermark-quality">Image Quality</Label>
            <Select value={watermarkQuality} onValueChange={(value: "512p" | "1080p" | "2K" | "4K") => setWatermarkQuality(value)}>
              <SelectTrigger id="watermark-quality">
                <SelectValue placeholder="Select quality" />
              </SelectTrigger>
              <SelectContent>
                {QUALITY_OPTIONS.map((quality) => (
                  <SelectItem key={quality} value={quality}>
                    {quality}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="watermark-opacity">Watermark Opacity</Label>
              <span className="text-sm text-muted-foreground">{watermarkOpacity}%</span>
            </div>
            <Slider
              id="watermark-opacity"
              min={10}
              max={90}
              step={5}
              value={[watermarkOpacity]}
              onValueChange={(values: number[]) => {
                if (values[0] !== undefined) {
                  setWatermarkOpacity(values[0])
                }
              }}
            />
          </div>

          {error && (
            <div className="text-sm text-red-500">
              {error}
            </div>
          )}

          {uploadStatus && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{uploadStatus}</span>
                {uploadProgress !== null && (
                  <span>{Math.round(uploadProgress)}%</span>
                )}
              </div>
              {uploadProgress !== null && (
                <div className="w-full bg-secondary rounded-full h-2.5">
                  <div 
                    className="bg-primary h-2.5 rounded-full transition-all duration-300" 
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!title.trim() || isSubmitting}
            >
              {isSubmitting ? (uploadStatus || "Saving...") : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 