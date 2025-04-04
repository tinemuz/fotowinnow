"use client"

import { useState } from "react"
import { IconSettings } from "@tabler/icons-react"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Album } from "@/types/database"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase/client"
import { Textarea } from "@/components/ui/textarea"
import { useRouter } from "next/navigation"

interface AlbumSettingsDialogProps {
    album: Album
}

export function AlbumSettingsDialog({ album }: AlbumSettingsDialogProps) {
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [name, setName] = useState(album.name)
    const [description, setDescription] = useState(album.description || '')
    const [watermarkText, setWatermarkText] = useState(album.watermark_text)
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const { error } = await supabase
                .from('albums')
                .update({ 
                    name,
                    description: description || null,
                    watermark_text: watermarkText 
                })
                .eq('id', album.id)

            if (error) throw error

            toast.success("Album settings updated successfully")
            setOpen(false)
            router.refresh()
        } catch (error) {
            toast.error("Failed to update album settings")
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleArchive = async () => {
        setIsLoading(true)
        try {
            const { error } = await supabase
                .from('albums')
                .update({ status: 'archived' })
                .eq('id', album.id)

            if (error) throw error

            toast.success("Album archived successfully")
            setOpen(false)
            router.refresh()
        } catch (error) {
            toast.error("Failed to archive album")
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="icon">
                    <IconSettings className="h-4 w-4" />
                    <span className="sr-only">Album Settings</span>
                </Button>
            </DialogTrigger>
            <DialogContent>
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Album Settings</DialogTitle>
                        <DialogDescription>
                            Update your album settings and preferences.
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
                            <Label htmlFor="watermark">Watermark Text</Label>
                            <Input
                                id="watermark"
                                value={watermarkText}
                                onChange={(e) => setWatermarkText(e.target.value)}
                                placeholder="Enter watermark text"
                                disabled={isLoading}
                            />
                        </div>
                    </div>
                    <DialogFooter className="flex justify-between">
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={handleArchive}
                            disabled={isLoading || album.status === 'archived'}
                        >
                            Archive Album
                        </Button>
                        <div className="flex gap-2">
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isLoading}>
                                Save Changes
                            </Button>
                        </div>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
} 