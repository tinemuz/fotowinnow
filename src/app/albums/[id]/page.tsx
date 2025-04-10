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
import { Upload, Share2, Settings, ChevronRight } from "lucide-react";
import { UploadPhotosModal } from "~/components/upload-photos-modal"
import { NavBar } from "~/components/nav-bar"
import { AlbumSettingsModal } from "~/components/album-settings-modal"
import Link from "next/link";

interface UploadUrlResponse {
  signedUrl: string
  url: string
}

interface ProcessImageResponse {
  optimizedUrl: string
}

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
    watermarkQuality: "512p" | "1080p" | "2K" | "4K"
    watermarkOpacity: number
    coverImage?: File
  }, onProgress?: (status: string, progress?: number) => void) => {
    let coverImageUrl = settings.coverImage ? null : album?.coverImage;

    try {
      if (settings.coverImage) {
        const coverImageFile = settings.coverImage;
        // Get signed URL for upload
        const response = await fetch('/api/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contentType: coverImageFile.type,
            filename: coverImageFile.name,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to get upload URL for cover image');
        }

        const { signedUrl, url } = await response.json() as UploadUrlResponse;

        // Upload the original file with progress tracking
        onProgress?.("Uploading cover image...", 0);
        
        const xhr = new XMLHttpRequest();
        await new Promise<void>((resolve, reject) => {
          xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable) {
              const percentComplete = (event.loaded / event.total) * 100;
              onProgress?.("Uploading cover image...", percentComplete);
            }
          });

          xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve();
            } else {
              reject(new Error('Upload failed'));
            }
          });

          xhr.addEventListener('error', () => reject(new Error('Upload failed')));

          xhr.open('PUT', signedUrl);
          xhr.setRequestHeader('Content-Type', coverImageFile.type);
          xhr.send(coverImageFile);
        });

        // Process the image to create an optimized WebP version
        onProgress?.("Processing image...");
        const imageKey = url.replace('/api/images/', '');
        const processResponse = await fetch('/api/images/process', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            key: imageKey,
            watermark: '', // No watermark for cover images
            quality: '1080p', // Standard quality for cover images
            fontName: 'Space Mono',
            watermarkOpacity: 0
          }),
        });

        if (!processResponse.ok) {
          throw new Error('Failed to process cover image');
        }

        const { optimizedUrl } = await processResponse.json() as ProcessImageResponse;
        coverImageUrl = optimizedUrl;
      }

      onProgress?.("Saving album settings...");
      // Update album settings with the optimized cover image URL
      const updatedAlbum = await updateAlbumSettings(albumId, {
        ...settings,
        coverImage: coverImageUrl ?? album?.coverImage,
      });
      
      setAlbum(updatedAlbum);
      onProgress?.("Saved successfully!");
    } catch (err) {
      console.error("Failed to save settings:", err);
      throw err;
    }
  };

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
      <NavBar />
      <div className="container py-8 px-2">
        <div className="mb-8">
          <div className="text-2xl font-bold mb-2 flex items-center text-muted-foreground">
            <Link href="/" className="text-foreground/40 hover:text-foreground/50 pr-1">
              Albums
            </Link>
            {album.title && (
              <>
                <ChevronRight className="size-8" />
                <span className="text-foreground">{album.title}</span>
              </>
            )}
          </div>
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
              albumId={albumId}
              onAlbumUpdate={setAlbum}
              album={album}
            />
          </TabsContent>
          <TabsContent value="watermarked">
            <ImageGrid
              images={images}
              watermarked={true}
              onImageClick={handleImageClick}
              albumId={albumId}
              onAlbumUpdate={setAlbum}
              album={album}
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

