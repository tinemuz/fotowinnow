"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "~/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "~/components/ui/dialog"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { Textarea } from "~/components/ui/textarea"
import { Slider } from "~/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select"
import type { Album } from "~/lib/types"

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
  }) => Promise<void>
}

const QUALITY_OPTIONS = ["512p", "1080p", "2K", "4K"] as const;

export function AlbumSettingsModal({ isOpen, onClose, album, onSave }: AlbumSettingsModalProps) {
  const [title, setTitle] = useState(album.title)
  const [description, setDescription] = useState(album.description ?? "")
  const [watermarkText, setWatermarkText] = useState(album.watermarkText ?? "fotowinnow")
  const [watermarkQuality, setWatermarkQuality] = useState<"512p" | "1080p" | "2K" | "4K">(album.watermarkQuality ?? "1080p")
  const [watermarkOpacity, setWatermarkOpacity] = useState(album.watermarkOpacity ?? 30)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
        watermarkOpacity
      })
      onClose()
    } catch (err) {
      console.error("Error updating album settings:", err)
      setError("Failed to update album settings")
    } finally {
      setIsSubmitting(false)
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

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!title.trim() || isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 