"use client";

import type { Album } from "~/lib/types";
import { useRouter } from "next/navigation";

interface AlbumCardProps {
  id: number;
  title: string;
  description: string | null;
  coverImage: string;
  isShared: boolean;
  onClick: () => void;
}

export function AlbumCard({ title, description, coverImage, onClick }: AlbumCardProps) {
  return (
    <div
      className="overflow-hidden p-2 duration-100 ease-in-out cursor-pointer hover:bg-stone-100"
      onClick={onClick}
    >
      <div className="bg-muted relative aspect-4/3 w-full">
          <img
            src={coverImage}
            alt={title}
            className="absolute inset-0 h-full w-full object-cover"
          />
      </div>

      <div className="pt-2 font-semibold">{title}</div>
      <div className="text-xs text-stone-500">
        {description}
      </div>
    </div>
  )
}
