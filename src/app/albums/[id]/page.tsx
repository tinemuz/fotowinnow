"use client"

import { Button } from "~/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs"
import { ImageGrid } from "~/components/image-grid"
import { ShareModal } from "~/components/share-modal"
import { mockAlbums, mockImages, type Image as ImageType } from "~/lib/data"
import { ArrowLeft, Eye, Plus, Share, Settings } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { useParams } from "next/navigation"
import { ImageDetailModal } from "~/components/image-detail-modal"
import { AlbumSettings } from "~/components/album-settings"
import { Breadcrumbs } from "~/components/breadcrumbs"

export default function AlbumDetail() {
  const params = useParams()
  const albumId = params.id as string
  const album = mockAlbums.find((a) => a.id === albumId)
  const albumImages = mockImages.filter((img) => img.albumId === albumId)

  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState<ImageType | null>(null)
  const [isImageModalOpen, setIsImageModalOpen] = useState(false)
  const [currentView, setCurrentView] = useState<"photos" | "watermarked" | "settings">("photos")

  if (!album) {
    return <div>Album not found</div>
  }

  const handleImageClick = (image: ImageType) => {
    setSelectedImage(image)
    setIsImageModalOpen(true)
  }

  return (
    <div className="container py-10 space-y-8">
      <Breadcrumbs items={[{ label: "Albums", href: "/" }, { label: album.title }]} />

      <div className="flex items-center gap-4">
        <Link href="/">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">{album.title}</h1>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <p className="text-muted-foreground">{album.description}</p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsShareModalOpen(true)}>
            <Share className="mr-2 h-4 w-4" />
            Share Album
          </Button>
          <Link href={`/shared/${albumId}`} target="_blank">
            <Button variant="outline">
              <Eye className="mr-2 h-4 w-4" />
              Preview Client View
            </Button>
          </Link>
        </div>
      </div>

      <Tabs
        defaultValue="photos"
        onValueChange={(value) => setCurrentView(value as "photos" | "watermarked" | "settings")}
      >
        <TabsList>
          <TabsTrigger value="photos">Photos</TabsTrigger>
          <TabsTrigger value="watermarked">Watermarked Preview</TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>
        <TabsContent value="photos" className="pt-4">
          <div className="flex justify-between mb-4">
            <h2 className="text-xl font-semibold">Album Photos</h2>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Photos
            </Button>
          </div>
          <ImageGrid images={albumImages} watermarked={false} onImageClick={handleImageClick} />
        </TabsContent>
        <TabsContent value="watermarked" className="pt-4">
          <div className="mb-4">
            <h2 className="text-xl font-semibold">Watermarked Preview</h2>
            <p className="text-sm text-muted-foreground">This is how clients will see your photos</p>
          </div>
          <ImageGrid images={albumImages} watermarked={true} onImageClick={handleImageClick} />
        </TabsContent>
        <TabsContent value="settings" className="pt-4">
          <div className="mb-4">
            <h2 className="text-xl font-semibold">Album Settings</h2>
            <p className="text-sm text-muted-foreground">Configure sharing and client permissions</p>
          </div>
          <AlbumSettings album={album} />
        </TabsContent>
      </Tabs>

      <ShareModal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} albumId={albumId} />

      <ImageDetailModal
        image={selectedImage}
        images={albumImages}
        isOpen={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
        watermarked={currentView === "watermarked"}
        isClientView={false}
        onNavigate={setSelectedImage}
      />
    </div>
  )
}

