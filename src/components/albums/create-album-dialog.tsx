"use client"

import {useState} from "react"
import {IconPlus} from "@tabler/icons-react"
import {Button} from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {Input} from "@/components/ui/input"
import {Label} from "@/components/ui/label"
import {Textarea} from "@/components/ui/textarea"
import { createAlbum } from "@/lib/actions/albums"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export function CreateAlbumDialog() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [clientGreeting, setClientGreeting] = useState("")
  const [watermarkText, setWatermarkText] = useState("fotowinnow")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const formData = new FormData()
      formData.append('name', name)
      formData.append('description', description)
      formData.append('client_greeting', clientGreeting)
      formData.append('watermark_text', watermarkText)

      await createAlbum(formData)
      toast.success("Album created successfully")
      setOpen(false)
      setName("")
      setDescription("")
      setClientGreeting("")
      setWatermarkText("fotowinnow")
      router.refresh()
    } catch (error) {
      toast.error("Failed to create album")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <IconPlus className="mr-2 h-4 w-4" />
          Create Album
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Album</DialogTitle>
            <DialogDescription>
              Create a new album to organize your photos.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter album name"
                required
                disabled={isLoading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter album description"
                disabled={isLoading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="client_greeting">Client Greeting</Label>
              <Textarea
                id="client_greeting"
                value={clientGreeting}
                onChange={(e) => setClientGreeting(e.target.value)}
                placeholder="Enter a greeting message for clients"
                disabled={isLoading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="watermark_text">Watermark Text</Label>
              <Input
                id="watermark_text"
                value={watermarkText}
                onChange={(e) => setWatermarkText(e.target.value)}
                placeholder="Enter watermark text"
                disabled={isLoading}
              />
              <p className="text-sm text-muted-foreground">
                This text will be used as a watermark on all photos in this album.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Album"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 