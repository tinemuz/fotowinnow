import { getAlbum } from "@/lib/actions/albums"
import { getPhotos } from "@/lib/actions/photos"
import { AlbumPhotos } from "@/components/albums/album-photos"
import { UploadPhotoDialog } from "@/components/albums/upload-photo-dialog"
import { notFound } from "next/navigation"
import { Metadata } from "next"
import { Suspense } from "react"

interface AlbumPageProps {
  params: Promise<{
    albumId: string
  }>
}

export async function generateMetadata({ params }: AlbumPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const album = await getAlbum(resolvedParams.albumId)
  return {
    title: album?.name || "Album",
  }
}

async function AlbumContent({ albumId }: { albumId: string }) {
  const photos = await getPhotos(albumId)
  return <AlbumPhotos photos={photos} />
}

export default async function AlbumPage({ params }: AlbumPageProps) {
  const resolvedParams = await params;
  const album = await getAlbum(resolvedParams.albumId)

  if (!album) {
    notFound()
  }

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{album.name}</h1>
          {album.description && (
            <p className="text-muted-foreground mt-1">{album.description}</p>
          )}
        </div>
        <UploadPhotoDialog albumId={resolvedParams.albumId} />
      </div>
      <Suspense fallback={<AlbumPhotos photos={[]} isLoading />}>
        <AlbumContent albumId={resolvedParams.albumId} />
      </Suspense>
    </div>
  )
} 