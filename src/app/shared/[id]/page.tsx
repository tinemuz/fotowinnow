"use client"

import { ClientImageCard } from "~/components/client-image-card"
import { mockAlbums, mockImages, type Image as ImageType } from "~/lib/data"
import { useParams } from "next/navigation"
import { useState } from "react"
import { ImageDetailModal } from "~/components/image-detail-modal"
import { Breadcrumbs } from "~/components/breadcrumbs"

export default function SharedAlbumView() {
  const params = useParams()
  const albumId = params.id as string
  const album = mockAlbums.find((a) => a.id === albumId)
  const albumImages = mockImages.filter((img) => img.albumId === albumId)

  const [selectedImage, setSelectedImage] = useState<ImageType | null>(null)
  const [isImageModalOpen, setIsImageModalOpen] = useState(false)

  if (!album) {
    return <div>Album not found</div>
  }

  const handleImageClick = (image: ImageType) => {
    setSelectedImage(image)
    setIsImageModalOpen(true)
  }

  return (
    <div className="container py-10 space-y-8">
      <Breadcrumbs items={[{ label: "Shared Albums", href: "/" }, { label: album.title }]} />

      <div className="text-center space-y-2 max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold">{album.title}</h1>
        <p className="text-muted-foreground">{album.description}</p>
        <div className="text-sm text-muted-foreground border-t border-b py-2 my-4">
          Shared with you by {album.photographerName}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {albumImages.map((image) => (
          <ClientImageCard key={image.id} image={image} onImageClick={handleImageClick} />
        ))}
      </div>

      <ImageDetailModal
        image={selectedImage}
        images={albumImages}
        isOpen={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
        watermarked={true}
        isClientView={true}
        onNavigate={setSelectedImage}
      />
    </div>
  )
}

