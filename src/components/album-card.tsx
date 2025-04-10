"use client";

import type { Album } from "~/lib/types";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface AlbumCardProps {
  album: Album;
}

export function AlbumCard({ album }: AlbumCardProps) {
  const router = useRouter();

  const handleViewAlbum = () => {
    router.push(`/albums/${album.id}`);
  };

  return (
    <div
      className="overflow-hidden p-2 duration-100 ease-in-out cursor-pointer hover:bg-stone-100"
      onClick={handleViewAlbum}
    >
      <div className="bg-muted relative aspect-4/3 w-full">
        {album.coverImage ? (
          <img
            src={album.coverImage}
            alt={album.title}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="text-muted-foreground">No cover image</p>
          </div>
        )}
      </div>


      <div className="pt-2 font-semibold">{album.title}</div>
      <div className="text-sm text-stone-500">
        {new Date(album.updatedAt ?? album.createdAt).toLocaleDateString(
          "en-US",
          {
            year: "numeric",
            month: "long",
            day: "numeric",
          },
        )}
      </div>
    </div>
  );
}
