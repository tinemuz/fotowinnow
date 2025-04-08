"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Button } from "~/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs"
import { ImageGrid } from "~/components/image-grid"
import { ShareModal } from "~/components/share-modal"
import { ImageDetailModal } from "~/components/image-detail-modal"
import { type Album, type Image as ImageType } from "~/lib/types"
import { fetchAlbumById, fetchAlbumImages, createImage, updateAlbumSettings } from "~/lib/api"
import { Upload, Share2, Settings } from "lucide-react"
import { UploadPhotosModal } from "~/components/upload-photos-modal"
import { NavBar } from "~/components/nav-bar"
import { AlbumSettingsModal } from "~/components/album-settings-modal"

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
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false)
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

  const handleUploadPhotos = async (files: (File & { key?: string; url?: string })[]) => {
    try {
      for (const file of files) {
        if (!file.key || !file.url) {
          console.error('Missing key or URL for file:', file.name);
          continue;
        }
        
        const newImage = await createImage(albumId, {
          filename: file.name,
          caption: file.name,
          url: file.url
        });
        setImages((prev) => [...prev, newImage]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload images");
    }
  }

  const handleSettingsSave = async (settings: {
    title: string
    description: string
    watermarkText: string
    watermarkQuality: number
    watermarkOpacity: number
  }) => {
    try {
      const updatedAlbum = await updateAlbumSettings(albumId, settings)
      setAlbum(updatedAlbum)
    } catch (err) {
      console.error("Failed to save settings:", err)
      throw err
    }
  }

  if (isLoading) {
    return (
      <>
        <NavBar />
        <div className="container py-8">Loading...</div>
      </>
    )
  }

  if (error) {
    return (
      <>
        <NavBar />
        <div className="container py-8 text-red-500">{error}</div>
      </>
    )
  }

  if (!album) {
    return (
      <>
        <NavBar />
        <div className="container py-8">Album not found</div>
      </>
    )
  }

  return (
    <>
      <NavBar albumTitle={album.title} />
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{album.title}</h1>
          <p className="text-muted-foreground">{album.description}</p>
        </div>

        <div className="flex justify-end mb-8">
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsShareModalOpen(true)}>
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
            <Button variant="outline" onClick={() => setIsSettingsModalOpen(true)}>
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            <Button onClick={() => setIsUploadModalOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Upload Photos
            </Button>
          </div>
        </div>

        <Tabs defaultValue="photos" value={currentView} onValueChange={(value) => setCurrentView(value as typeof currentView)}>
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

        <AlbumSettingsModal
          isOpen={isSettingsModalOpen}
          onClose={() => setIsSettingsModalOpen(false)}
          album={album}
          onSave={handleSettingsSave}
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
    </>
  )
}

