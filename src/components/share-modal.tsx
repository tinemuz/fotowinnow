"use client"

import { Button } from "~/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog"
import { Input } from "~/components/ui/input"
import { Copy, Check } from "lucide-react"
import { useState } from "react"
import { type Album } from "~/lib/types"

interface ShareModalProps {
  isOpen: boolean
  onClose: () => void
  album: Album
}

export function ShareModal({ isOpen, onClose, album }: ShareModalProps) {
  const [copied, setCopied] = useState(false)
  const shareUrl = `${window.location.origin}/shared/${album.id}`

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Album</DialogTitle>
        </DialogHeader>
        <div className="flex items-center space-y-2 pt-2">
          <div className="grid flex-1 gap-2">
            <div className="flex">
              <Input readOnly value={shareUrl} className="rounded-r-none" />
              <Button type="button" className="rounded-l-none" onClick={copyToClipboard}>
                {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                Copy
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              This link allows clients to view watermarked photos and add comments.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

