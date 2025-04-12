"use client"

import { ClientImageCard } from "~/components/client-image-card"
import { type Image as ImageType } from "~/lib/types"
import { useParams } from "next/navigation"
import { useState, useEffect } from "react"
import { ImageDetailModal } from "~/components/image-detail-modal"
import { fetchAlbumById, fetchAlbumImages } from "~/lib/api"

export default function SharedAlbumView() {
  const params = useParams()
  const albumId = Number(params.id)

  const [album, setAlbum] = useState<Awaited<ReturnType<typeof fetchAlbumById>> | null>(null)
  const [images, setImages] = useState<ImageType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedImage, setSelectedImage] = useState<ImageType | null>(null)

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

    void loadAlbum();
  }, [albumId])

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="mb-8">
          <div className="animate-pulse">
            <div className="h-8 bg-stone-100 rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-stone-100 rounded w-1/2"></div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {[...Array(15)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-square bg-stone-100 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return <div className="container py-8 text-red-500">{error}</div>
  }

  if (!album) {
    return <div className="container py-8">Album not found</div>
  }

  const handleImageClick = (image: ImageType) => {
    setSelectedImage(image)
  }

  return (
    <div className="container py-6 space-y-6">
      <div className="text-center space-y-2 max-w-2xl mx-auto">
        <h1 className="text-xl font-bold">{album.title}</h1>
        <p className="text-sm text-muted-foreground">{album.description}</p>
        <span className="text-sm text-foreground/50">Add your comments suggestions or thoughts on your photos.</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {images.map((image) => (
          <ClientImageCard key={image.id} image={image} onImageClick={handleImageClick} />
        ))}
      </div>

      <ImageDetailModal
        image={selectedImage}
        images={images}
        isOpen={!!selectedImage}
        onClose={() => setSelectedImage(null)}
        watermarked={true}
        isClientView={true}
        onNavigate={setSelectedImage}
      />
    </div>
  )
}

