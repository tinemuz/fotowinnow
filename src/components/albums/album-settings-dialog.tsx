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

interface AlbumSettingsDialogProps {
    album: Album
}

export function AlbumSettingsDialog({ album }: AlbumSettingsDialogProps) {
    const [open, setOpen] = useState(false)
    const [watermarkText, setWatermarkText] = useState(album.watermark_text)
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const { error } = await supabase
                .from('albums')
                .update({ watermark_text: watermarkText })
                .eq('id', album.id)

            if (error) throw error

            toast.success("Album settings updated successfully")
            setOpen(false)
        } catch (error) {
            toast.error("Failed to update album settings")
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
                            Configure settings for your album.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
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
                            {isLoading ? "Saving..." : "Save Changes"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
} 