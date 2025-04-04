"use client"

import { Photo } from "@/lib/actions/photos"
import Image from "next/image"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CircleAlert, ALargeSmall, CircleX, Check } from "lucide-react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { applyAlbumWatermark } from "@/lib/actions/albums"
import { deletePhoto } from "@/lib/actions/photos"
import { toast } from "sonner"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Progress } from "@/components/ui/progress"
import { createSupabaseClient } from '@/lib/supabase/client'
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js'

interface AlbumPhotosProps {
  photos: Photo[]
  isLoading?: boolean
  error?: string
  albumId: string
}

interface WatermarkJob {
  id: string
  status: 'pending' | 'processing' | 'completed' | 'completed_with_errors' | 'failed'
  total_photos: number
  processed_photos: number
}

export function AlbumPhotos({ photos: initialPhotos, isLoading, error, albumId }: AlbumPhotosProps) {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set())
  const [photos, setPhotos] = useState(initialPhotos)
  const [isWatermarking, setIsWatermarking] = useState(false)
  const [viewMode, setViewMode] = useState<"original" | "watermarked">("original")
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set())
  const [isDeleting, setIsDeleting] = useState(false)
  const supabase = createSupabaseClient()

  // Calculate progress based on photos
  const watermarkedCount = photos.filter(p => p.storage_path_watermarked).length
  const totalPhotos = photos.length
  const progress = totalPhotos > 0 ? Math.round((watermarkedCount / totalPhotos) * 100) : 0

  useEffect(() => {
    setPhotos(initialPhotos)
  }, [initialPhotos])

  // Clear loaded images when switching views
  useEffect(() => {
    setLoadedImages(new Set())
  }, [viewMode])

  useEffect(() => {
    // Subscribe to photo updates
    const photosChannel = supabase
      .channel('photos-updates')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen for all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'photos',
          filter: `album_id=eq.${albumId}`
        },
        (payload: RealtimePostgresChangesPayload<Photo>) => {
          if (payload.eventType === 'DELETE') {
            // Remove the deleted photo from the state
            setPhotos(currentPhotos => 
              currentPhotos.filter(photo => photo.id !== payload.old.id)
            )
          } else if (payload.eventType === 'UPDATE') {
            // Update the photo in the state
            const newPhoto = payload.new as Photo;
            if (!newPhoto?.id) return;
            
            setPhotos(currentPhotos => 
              currentPhotos.map(photo => 
                photo.id === newPhoto.id ? { ...photo, ...newPhoto } : photo
              )
            )
          }
        }
      )
      .subscribe()

    return () => {
      photosChannel.unsubscribe()
    }
  }, [albumId, supabase])

  const handleImageLoad = (photoId: string) => {
    setLoadedImages(prev => new Set([...prev, photoId]))
  }

  const handleWatermark = async () => {
    if (isWatermarking) return;
    
    setIsWatermarking(true)
    const result = await applyAlbumWatermark(albumId)
    
    if (!result.success) {
      setIsWatermarking(false)
      toast.error(result.error || 'Failed to start watermarking')
    } else {
      // Set a timeout to reset the watermarking state after a reasonable time
      // This is a fallback in case the real-time updates don't work
      setTimeout(() => {
        setIsWatermarking(false)
      }, 30000) // 30 seconds should be enough for most albums
    }
  }

  const handlePhotoSelect = (photoId: string) => {
    setSelectedPhotos(prev => {
      const newSelection = new Set(prev)
      if (newSelection.has(photoId)) {
        newSelection.delete(photoId)
      } else {
        newSelection.add(photoId)
      }
      return newSelection
    })
  }

  const handleDeleteSelected = async () => {
    if (selectedPhotos.size === 0) return
    
    console.log('Starting deletion of selected photos:', Array.from(selectedPhotos));
    setIsDeleting(true)
    try {
      const deletePromises = Array.from(selectedPhotos).map(photoId => {
        console.log('Sending delete request for photoId:', photoId);
        return deletePhoto(photoId);
      });
      
      console.log('Waiting for all delete operations to complete...');
      const results = await Promise.all(deletePromises);
      
      console.log('Delete results:', results);
      const failedCount = results.filter((r: { success: boolean; error?: string }) => !r.success).length;
      
      if (failedCount > 0) {
        console.error(`Failed to delete ${failedCount} photo(s):`, 
          results.filter(r => !r.success).map(r => r.error));
        toast.error(`Failed to delete ${failedCount} photo${failedCount > 1 ? 's' : ''}`);
      } else {
        console.log(`Successfully deleted ${selectedPhotos.size} photo(s)`);
        toast.success(`Successfully deleted ${selectedPhotos.size} photo${selectedPhotos.size > 1 ? 's' : ''}`);
        
        // Update local state immediately
        console.log('Updating local state to remove deleted photos');
        setPhotos(currentPhotos => 
          currentPhotos.filter(photo => !selectedPhotos.has(photo.id))
        );
        
        // Clear selection
        console.log('Clearing photo selection');
        setSelectedPhotos(new Set());
      }
    } catch (error) {
      console.error('Error during photo deletion:', error);
      toast.error('An error occurred while deleting photos');
    } finally {
      setIsDeleting(false);
    }
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <CircleAlert className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "original" | "watermarked")}>
          <TabsList>
            <TabsTrigger value="original">Original</TabsTrigger>
            <TabsTrigger value="watermarked" disabled={!photos.some(p => p.storage_path_watermarked)}>
              Watermarked
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-4">
          {selectedPhotos.size > 0 && (
            <Button
              variant="destructive"
              onClick={handleDeleteSelected}
              disabled={isDeleting}
            >
              <CircleX className="mr-2 h-4 w-4" />
              {isDeleting ? 'Deleting...' : `Delete ${selectedPhotos.size} Photo${selectedPhotos.size > 1 ? 's' : ''}`}
            </Button>
          )}

          {isWatermarking && (
            <div className="flex items-center gap-2">
              <Progress value={progress} className="w-[100px]" />
              <span className="text-sm text-muted-foreground">
                {watermarkedCount}/{totalPhotos}
              </span>
            </div>
          )}
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={handleWatermark}
                  disabled={isWatermarking || !photos.length}
                >
                  <ALargeSmall className="mr-2 h-4 w-4" />
                  {isWatermarking ? 'Watermarking...' : 'Add Watermark'}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Add watermark to all photos in this album</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {viewMode === "watermarked" ? (
          photos.some(p => p.storage_path_watermarked) ? (
            photos
              .filter(photo => photo.storage_path_watermarked)
              .map((photo) => (
                <div 
                  key={photo.id} 
                  className="relative aspect-square rounded-sm overflow-hidden group cursor-pointer"
                  onClick={() => handlePhotoSelect(photo.id)}
                >
                  {!loadedImages.has(photo.id) && (
                    <Skeleton className="absolute inset-0" />
                  )}
                  <Image
                    src={`/api/photos/${encodeURIComponent(photo.storage_path_watermarked || '')}`}
                    alt={photo.filename_original}
                    fill
                    className={`object-cover transition-opacity duration-200 ${loadedImages.has(photo.id) ? 'opacity-100' : 'opacity-0'}`}
                    sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    priority={false}
                    unoptimized
                    onLoadingComplete={() => handleImageLoad(photo.id)}
                    onError={(e) => {
                      console.error('Image loading error:', {
                        photoId: photo.id,
                        viewMode,
                        hasWatermarked: !!photo.storage_path_watermarked,
                        path: photo.storage_path_watermarked
                      })
                    }}
                  />
                  <div className={`absolute top-2 right-2 z-10 ${selectedPhotos.has(photo.id) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity duration-200`}>
                    <div className={`rounded-full p-1.5 ${selectedPhotos.has(photo.id) ? 'bg-primary text-primary-foreground' : 'bg-white/20 text-white'}`}>
                      <Check className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              ))
          ) : (
            <div className="col-span-full flex flex-col items-center justify-center p-8 text-center">
              <CircleAlert className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-lg font-medium">No watermarked photos available</p>
              <p className="text-sm text-muted-foreground mt-1">
                Click the "Add Watermark" button to create watermarked versions of your photos.
              </p>
            </div>
          )
        ) : (
          photos.map((photo) => (
            <div 
              key={photo.id} 
              className="relative aspect-square rounded-sm overflow-hidden group cursor-pointer"
              onClick={() => handlePhotoSelect(photo.id)}
            >
              {!loadedImages.has(photo.id) && (
                <Skeleton className="absolute inset-0" />
              )}
              <Image
                src={`/api/photos/${encodeURIComponent(photo.storage_path_original)}`}
                alt={photo.filename_original}
                fill
                className={`object-cover transition-opacity duration-200 ${loadedImages.has(photo.id) ? 'opacity-100' : 'opacity-0'}`}
                sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                priority={false}
                unoptimized
                onLoadingComplete={() => handleImageLoad(photo.id)}
                onError={(e) => {
                  console.error('Image loading error:', {
                    photoId: photo.id,
                    viewMode,
                    hasWatermarked: !!photo.storage_path_watermarked,
                    path: photo.storage_path_original
                  })
                }}
              />
              <div className={`absolute top-2 right-2 z-10 ${selectedPhotos.has(photo.id) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity duration-200`}>
                <div className={`rounded-full p-1.5 ${selectedPhotos.has(photo.id) ? 'bg-primary text-primary-foreground' : 'bg-white/20 text-white'}`}>
                  <Check className="h-4 w-4" />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
} 