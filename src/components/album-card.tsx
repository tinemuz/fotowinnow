import { Card, CardContent, CardFooter, CardHeader } from "~/components/ui/card"
import type { Album } from "~/lib/data"
import Image from "next/image"
import { Badge } from "~/components/ui/badge"
import { Calendar, ImageIcon } from "lucide-react"
import Link from "next/link"

interface AlbumCardProps {
  album: Album
}

export function AlbumCard({ album }: AlbumCardProps) {
  return (
    <Link href={`/albums/${album.id}`}>
      <Card className="overflow-hidden hover:shadow-md transition-shadow py-0">
        <div className="relative h-40 w-full">
          {album.coverImage ? (
            <Image src={album.coverImage || "/placeholder.svg"} alt={album.title} fill className="object-cover" />
          ) : (
            <div className="h-full w-full flex items-center justify-center bg-muted">
              <ImageIcon className="h-10 w-10 text-muted-foreground" />
            </div>
          )}
        </div>
        <CardHeader className="">
          <div className="flex justify-between items-start">
            <h3 className="font-medium text-base">{album.title}</h3>
            <Badge variant={album.isShared ? "default" : "outline"} className="text-xs">
              {album.isShared ? "Shared" : "Draft"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="">
          <p className="text-xs text-muted-foreground line-clamp-1">{album.description}</p>
        </CardContent>
        <CardFooter className="text-xs text-muted-foreground p-3 pt-0 flex justify-between">
          <div className="flex items-center">
            <ImageIcon className="h-3 w-3 mr-1" />
            {album.imageCount} photos
          </div>
          <div className="flex items-center">
            <Calendar className="h-3 w-3 mr-1" />
            {new Date(album.createdAt).toLocaleDateString()}
          </div>
        </CardFooter>
      </Card>
    </Link>
  )
}

