import {AlbumsList} from "@/components/albums/albums-list"
import {CreateAlbumDialog} from "@/components/albums/create-album-dialog"

export default function AlbumsPage() {
  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Albums</h1>
        <CreateAlbumDialog />
      </div>
      <AlbumsList />
    </div>
  )
} 