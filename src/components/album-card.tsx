"use client";

import { useState } from 'react';

interface AlbumCardProps {
  id: number;
  title: string;
  description: string | null;
  coverImage: string;
  updatedAt: Date;
  createdAt: Date;
  isShared: boolean;
  onClick: () => void;
}

export function AlbumCard({ title, coverImage, onClick, updatedAt, createdAt }: AlbumCardProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div
      className="overflow-hidden p-2 duration-100 ease-in-out cursor-pointer hover:bg-stone-100"
      onClick={onClick}
    >
      <div className="bg-muted relative aspect-4/3 w-full">
          <img
            src={coverImage}
            alt={title}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-200 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setIsLoaded(true)}
          />
      </div>

      <div className="pt-2 font-semibold">{title}</div>
      <div className="text-xs text-stone-500">
        <div>
          {new Date(updatedAt ?? createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </div>
      </div>
    </div>
  )
}
