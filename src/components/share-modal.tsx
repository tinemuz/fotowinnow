"use client"

import { Button } from "~/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { Copy, Check } from "lucide-react"
import { useState } from "react"

interface ShareModalProps {
  isOpen: boolean
  onClose: () => void
  albumId: string
}

export function ShareModal({ isOpen, onClose, albumId }: ShareModalProps) {
  const [copied, setCopied] = useState(false)
  const shareUrl = `${window.location.origin}/shared/${albumId}`

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Album</DialogTitle>
          <DialogDescription>
            Share this link with your client to let them view and comment on the photos.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center space-y-2 pt-4">
          <Label htmlFor="link" className="sr-only">
            Share Link
          </Label>
          <div className="grid flex-1 gap-2">
            <Input id="link" readOnly value={shareUrl} className="w-full" />
            <p className="text-xs text-muted-foreground">
              This link will allow your client to view watermarked photos and add comments.
            </p>
          </div>
          <Button type="button" size="icon" className="ml-2" onClick={copyToClipboard}>
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            <span className="sr-only">Copy</span>
          </Button>
        </div>
        <DialogFooter className="sm:justify-start">
          <Button type="button" variant="secondary" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

