"use client"

import { Button } from "~/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs"
import { ImageGrid } from "~/components/image-grid"
import { ShareModal } from "~/components/share-modal"
import { mockAlbums, mockImages, type Image as ImageType } from "~/lib/data"
import { ArrowLeft, Eye, Plus, Share } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { useParams } from "next/navigation"
import { ImageDetailModal } from "~/components/image-detail-modal"
import { UploadPhotosModal } from "~/components/upload-photos-modal"

export default function AlbumDetail() {
  const params = useParams()
  const albumId = params.id as string
  const album = mockAlbums.find((a) => a.id === albumId)
  const [albumImages, setAlbumImages] = useState(mockImages.filter((img) => img.albumId === albumId))

  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState<ImageType | null>(null)
  const [isImageModalOpen, setIsImageModalOpen] = useState(false)
  const [currentView, setCurrentView] = useState<"photos" | "watermarked">("photos")

  if (!album) {
    return <div>Album not found</div>
  }

  const handleImageClick = (image: ImageType) => {
    setSelectedImage(image)
    setIsImageModalOpen(true)
  }

  const handleUploadPhotos = (files: File[]) => {
    // Create mock images from the uploaded files
    const newImages = files.map((file, index) => ({
      id: `img-${Date.now()}-${index}`,
      albumId,
      url: "/placeholder.svg", // In a real app, this would be the uploaded file URL
      caption: file.name.split(".")[0], // Use filename as caption
      createdAt: new Date().toISOString(),
    }))

    setAlbumImages([...newImages, ...albumImages])
  }

  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold">{album.title}</h1>
      </div>

      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">{album.description}</p>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setIsShareModalOpen(true)}>
            <Share className="mr-2 h-4 w-4" />
            Share
          </Button>
          <Link href={`/shared/${albumId}`} target="_blank">
            <Button size="sm" variant="outline">
              <Eye className="mr-2 h-4 w-4" />
              Preview
            </Button>
          </Link>
        </div>
      </div>

      <Tabs defaultValue="photos" onValueChange={(value) => setCurrentView(value as "photos" | "watermarked")}>
        <TabsList>
          <TabsTrigger value="photos">Photos</TabsTrigger>
          <TabsTrigger value="watermarked">Watermarked</TabsTrigger>
        </TabsList>
        <TabsContent value="photos" className="pt-4">
          <div className="flex justify-between mb-4">
            <h2 className="text-lg font-medium">Album Photos</h2>
            <Button size="sm" onClick={() => setIsUploadModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Photos
            </Button>
          </div>
          <ImageGrid images={albumImages} watermarked={false} onImageClick={handleImageClick} />
        </TabsContent>
        <TabsContent value="watermarked" className="pt-4">
          <div className="mb-4">
            <h2 className="text-lg font-medium">Watermarked Preview</h2>
          </div>
          <ImageGrid images={albumImages} watermarked={true} onImageClick={handleImageClick} />
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

      <UploadPhotosModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        _albumId={albumId}
        onUploadPhotos={handleUploadPhotos}
      />
    </div>
  )
}

