"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Button } from "~/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs"
import { ImageGrid } from "~/components/image-grid"
import { ShareModal } from "~/components/share-modal"
import { ImageDetailModal } from "~/components/image-detail-modal"
import { type Album, type Image as ImageType } from "~/lib/types"
import { fetchAlbumById, fetchAlbumImages, createImage } from "~/lib/api"
import { ArrowLeft, Upload } from "lucide-react"
import Link from "next/link"
import { UploadPhotosModal } from "~/components/upload-photos-modal"

export default function AlbumDetail() {
  const params = useParams()
  const albumId = Number(params.id)

  const [album, setAlbum] = useState<Album | null>(null)
  const [images, setImages] = useState<ImageType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedImage, setSelectedImage] = useState<ImageType | null>(null)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [currentView, setCurrentView] = useState<"photos" | "watermarked">("photos")

  useEffect(() => {
    const loadAlbum = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const albumData = await fetchAlbumById(albumId)
        setAlbum(albumData)
        const albumImages = await fetchAlbumImages(albumId)
        console.log('Loaded images:', albumImages)
        setImages(albumImages)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load album")
      } finally {
        setIsLoading(false)
      }
    }

    void loadAlbum()
  }, [albumId])

  const handleImageClick = (image: ImageType) => {
    setSelectedImage(image)
  }

  const handleUploadPhotos = async (files: File[]) => {
    try {
      for (const file of files) {
        const newImage = await createImage(albumId, {
          filename: file.name,
          caption: file.name,
        })
        setImages((prev) => [...prev, newImage])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload images")
    }
  }

  if (isLoading) {
    return <div className="container py-8">Loading...</div>
  }

  if (error) {
    return <div className="container py-8 text-red-500">{error}</div>
  }

  if (!album) {
    return <div className="container py-8">Album not found</div>
  }

  return (
    <div className="container py-8">
      <div className="flex items-center gap-2 mb-6">
        <Link href="/">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">{album.title}</h1>
      </div>
      
      <div className="flex justify-between items-center mb-8">
        <div>
          <p className="text-muted-foreground">{album.description}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsShareModalOpen(true)}>
            Share
          </Button>
          <Button onClick={() => setIsUploadModalOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Upload Photos
          </Button>
        </div>
      </div>

      <Tabs defaultValue="photos" onValueChange={(value) => setCurrentView(value as "photos" | "watermarked")}>
        <TabsList>
          <TabsTrigger value="photos">Photos</TabsTrigger>
          <TabsTrigger value="watermarked">Watermarked</TabsTrigger>
        </TabsList>
        <TabsContent value="photos">
          <ImageGrid
            images={images}
            watermarked={false}
            onImageClick={handleImageClick}
          />
        </TabsContent>
        <TabsContent value="watermarked">
          <ImageGrid
            images={images}
            watermarked={true}
            onImageClick={handleImageClick}
          />
        </TabsContent>
      </Tabs>

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        album={album}
      />

      <ImageDetailModal
        image={selectedImage}
        images={images}
        isOpen={!!selectedImage}
        onClose={() => setSelectedImage(null)}
        watermarked={currentView === "watermarked"}
        isClientView={false}
        onNavigate={setSelectedImage}
      />
      
      <UploadPhotosModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        _albumId={albumId.toString()}
        onUploadPhotos={handleUploadPhotos}
      />
    </div>
  )
}

