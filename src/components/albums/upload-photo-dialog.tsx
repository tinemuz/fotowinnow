"use client"

import { useState } from "react"
import { IconUpload } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { uploadPhoto } from "@/lib/actions/photos"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Progress } from "@/components/ui/progress"

interface UploadPhotoDialogProps {
  albumId: string
}

interface UploadStatus {
  file: File
  progress: number
  status: 'queued' | 'uploading' | 'completed' | 'error'
  error?: string
}

export function UploadPhotoDialog({ albumId }: UploadPhotoDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [uploads, setUploads] = useState<UploadStatus[]>([])
  const [isUploading, setIsUploading] = useState(false)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setUploads(files.map(file => ({
      file,
      progress: 0,
      status: 'queued'
    })))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsUploading(true)

    try {
      // Process each file sequentially
      for (let i = 0; i < uploads.length; i++) {
        const upload = uploads[i]
        if (upload.status === 'queued') {
          setUploads(prev => prev.map((u, idx) => 
            idx === i ? { ...u, status: 'uploading' } : u
          ))

          const formData = new FormData()
          formData.append("albumId", albumId)
          formData.append("file", upload.file)
          
          const result = await uploadPhoto(formData)
          
          setUploads(prev => prev.map((u, idx) => 
            idx === i ? { 
              ...u, 
              status: result.success ? 'completed' : 'error',
              error: result.success ? undefined : result.error,
              progress: 100
            } : u
          ))

          if (!result.success) {
            toast.error(`Failed to upload ${upload.file.name}: ${result.error}`)
          }
        }
      }

      // Check if all uploads completed successfully
      const allCompleted = uploads.every(u => u.status === 'completed')
      if (allCompleted) {
        toast.success("All photos uploaded successfully")
        setOpen(false)
        router.refresh()
      }
    } catch (error) {
      console.error(error)
      toast.error("An unexpected error occurred during upload")
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <IconUpload className="mr-2 h-4 w-4" />
          Upload Photos
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Upload Photos</DialogTitle>
            <DialogDescription>
              Upload one or more photos to this album. Supported formats: JPEG, PNG, WebP, GIF.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <input
                type="file"
                name="file"
                accept="image/*"
                multiple
                required
                disabled={isUploading}
                onChange={handleFileSelect}
                className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
              />
            </div>
            {uploads.length > 0 && (
              <div className="space-y-4">
                {uploads.map((upload, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="truncate">{upload.file.name}</span>
                      <span className="text-muted-foreground">
                        {upload.status === 'completed' && '✓'}
                        {upload.status === 'error' && '✗'}
                      </span>
                    </div>
                    <Progress value={upload.progress} />
                    {upload.error && (
                      <p className="text-sm text-destructive">{upload.error}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button 
              type="submit" 
              disabled={isUploading || uploads.length === 0}
            >
              {isUploading ? "Uploading..." : "Upload Photos"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 