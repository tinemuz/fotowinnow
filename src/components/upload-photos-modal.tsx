"use client"

import type React from "react"
import { Button } from "~/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "~/components/ui/dialog"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { ImagePlus, X } from "lucide-react"
import { useState, useRef } from "react"
import NextImage from "next/image"
import { toast } from "sonner"
import { Progress } from "~/components/ui/progress"
import { UploadProgressToast } from "~/components/upload-progress-toast"

interface UploadPhotosModalProps {
  isOpen: boolean
  onClose: () => void
  _albumId: string
  onUploadPhotos: (files: (File & { key?: string; url?: string })[]) => void
}

interface UploadResponse {
  signedUrl: string;
  key: string;
  url: string;
  error?: string;
}

type UploadProgressRecord = Record<string, number>;

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB in bytes
const MAX_CONCURRENT_UPLOADS = 3; // Maximum number of concurrent uploads

export function UploadPhotosModal({ isOpen, onClose, _albumId, onUploadPhotos }: UploadPhotosModalProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<UploadProgressRecord>({})
  const [uploadErrors, setUploadErrors] = useState<Record<string, string>>({})
  const [isUploadComplete, setIsUploadComplete] = useState(false)
  const [totalSelectedFiles, setTotalSelectedFiles] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = (file: File) => {
    console.log('Validating file:', { 
      name: file.name, 
      size: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
      type: file.type 
    });
    
    if (file.size > MAX_FILE_SIZE) {
      console.warn('File size validation failed:', { 
        name: file.name, 
        size: file.size, 
        maxSize: MAX_FILE_SIZE 
      });
      toast.error(`${file.name} is too large. Maximum size is 50MB.`);
      return false;
    }
    if (!file.type.startsWith('image/')) {
      console.warn('File type validation failed:', { 
        name: file.name, 
        type: file.type 
      });
      toast.error(`${file.name} is not an image file.`);
      return false;
    }
    console.log('File validation passed:', { name: file.name });
    return true;
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('File selection started');
    if (!e.target.files || e.target.files.length === 0) {
      console.log('No files selected');
      return;
    }

    const files = Array.from(e.target.files).filter(validateFile);
    console.log('Valid files selected:', { count: files.length });
    setSelectedFiles((prev) => [...prev, ...files]);
    setTotalSelectedFiles((prev) => prev + files.length);

    // Create previews
    const newPreviews = files.map((file) => URL.createObjectURL(file));
    console.log('Created file previews:', { count: newPreviews.length });
    setPreviews((prev) => [...prev, ...newPreviews]);
  }

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
    setTotalSelectedFiles((prev) => prev - 1)
    // Revoke the object URL to avoid memory leaks
    if (previews[index]) {
      URL.revokeObjectURL(previews[index])
    }
    setPreviews((prev) => prev.filter((_, i) => i !== index))
  }

  const uploadFile = async (file: File): Promise<{ key: string; url: string }> => {
    console.log('Starting file upload:', { name: file.name, size: `${(file.size / 1024 / 1024).toFixed(2)}MB` });
    try {
      // 1. Get the pre-signed URL
      console.log('Requesting pre-signed URL for:', file.name);
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json() as UploadResponse;
        console.error('Failed to get signed URL:', { 
          status: response.status,
          error: errorData.error 
        });
        throw new Error(errorData.error ?? `Failed to get signed URL (${response.status})`);
      }

      const { signedUrl, key, url } = await response.json() as UploadResponse;
      console.log('Received pre-signed URL:', { key, url });

      // 2. Upload to R2 with progress tracking
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            console.log('Upload progress:', { 
              file: file.name, 
              progress: `${progress}%`,
              loaded: `${(event.loaded / 1024 / 1024).toFixed(2)}MB`,
              total: `${(event.total / 1024 / 1024).toFixed(2)}MB`
            });
            setUploadProgress(prev => ({ ...prev, [file.name]: progress }));
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            console.log('File upload completed successfully:', { 
              file: file.name, 
              status: xhr.status 
            });
            resolve();
          } else {
            console.error('Upload failed with status:', { 
              file: file.name, 
              status: xhr.status,
              response: xhr.responseText
            });
            reject(new Error(`Upload failed with status ${xhr.status}: ${xhr.responseText || 'No error details available'}`));
          }
        });

        xhr.addEventListener('error', () => {
          console.error('Upload network error:', { 
            file: file.name,
            status: xhr.status,
            response: xhr.responseText
          });
          reject(new Error(`Network error during upload: ${xhr.responseText || 'Connection failed'}`));
        });

        xhr.addEventListener('abort', () => {
          console.error('Upload aborted:', { file: file.name });
          reject(new Error('Upload was aborted'));
        });

        try {
          console.log('Initiating file transfer to R2:', { file: file.name });
          xhr.open('PUT', signedUrl);
          xhr.setRequestHeader('Content-Type', file.type);
          xhr.send(file);
        } catch (error) {
          console.error('Failed to initiate upload:', {
            file: file.name,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
          reject(new Error('Failed to initiate upload'));
        }
      });

      console.log('Upload completed for file:', { name: file.name, key, url });
      return { key, url };
    } catch (error) {
      console.error('Error uploading file:', { 
        file: file.name, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      setUploadErrors(prev => ({
        ...prev,
        [file.name]: error instanceof Error ? error.message : 'Upload failed'
      }));
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Starting upload submission:', { fileCount: selectedFiles.length });
    if (selectedFiles.length === 0) {
      console.log('No files selected for upload');
      return;
    }

    setIsUploading(true);
    setIsUploadComplete(false);
    setUploadProgress({});
    setUploadErrors({});
    const uploadedFiles: Array<{ file: File; key: string; url: string }> = [];

    // Close the modal immediately
    onClose();

    try {
      // Upload files in parallel with a limit on concurrent uploads
      const files = [...selectedFiles];
      while (files.length > 0) {
        const batch = files.splice(0, MAX_CONCURRENT_UPLOADS);
        const uploadPromises = batch.map(async (file) => {
          try {
            const { key, url } = await uploadFile(file);
            uploadedFiles.push({ file, key, url });
          } catch (error) {
            console.error('Failed to process file:', { 
              name: file.name, 
              error: error instanceof Error ? error.message : 'Unknown error' 
            });
          }
        });

        await Promise.all(uploadPromises);
      }

      if (uploadedFiles.length > 0) {
        console.log('Upload batch completed:', { 
          successful: uploadedFiles.length,
          failed: selectedFiles.length - uploadedFiles.length
        });
        onUploadPhotos(uploadedFiles.map(({ file }) => Object.assign(file, { 
          key: uploadedFiles.find(f => f.file === file)?.key,
          url: uploadedFiles.find(f => f.file === file)?.url
        })));
        
        if (uploadedFiles.length === selectedFiles.length) {
          toast.success(`Successfully uploaded ${uploadedFiles.length} files`);
          // Clean up previews
          console.log('Cleaning up file previews');
          previews.forEach((preview) => URL.revokeObjectURL(preview));
          setSelectedFiles([]);
          setPreviews([]);
        } else {
          toast.warning(`Uploaded ${uploadedFiles.length} of ${selectedFiles.length} files`);
        }
      }
    } catch (error) {
      console.error('Upload submission error:', error instanceof Error ? {
        message: error.message,
        stack: error.stack
      } : error);
      toast.error('An error occurred during upload');
    } finally {
      setIsUploading(false);
      setIsUploadComplete(true);
      console.log('Upload submission completed');
    }
  }

  const handleRemoveUpload = (fileName: string) => {
    if (isUploadComplete) {
      setUploadProgress({});
      setUploadErrors({});
      setIsUploadComplete(false);
      setTotalSelectedFiles(0);
      return;
    }

    setUploadProgress(prev => {
      const newProgress = { ...prev };
      delete newProgress[fileName];
      return newProgress;
    });
    setUploadErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fileName];
      return newErrors;
    });
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Upload Photos</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div
              className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <ImagePlus className="h-8 w-8 mx-auto text-muted-foreground" />
              <p className="mt-2 text-sm font-medium">Click to select photos or drag and drop</p>
              <p className="text-xs text-muted-foreground mt-1">JPG, PNG or WEBP (max. 50MB each)</p>
              <Input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFileChange}
                disabled={isUploading}
              />
            </div>

            {previews.length > 0 && (
              <div className="space-y-2">
                <Label>Selected Photos ({previews.length})</Label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {previews.map((preview, index) => (
                    <div key={index} className="relative aspect-square rounded-md overflow-hidden border">
                      <NextImage
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 right-1 h-5 w-5 rounded-full"
                        onClick={(e) => {
                          e.stopPropagation()
                          removeFile(index)
                        }}
                        disabled={isUploading}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} disabled={isUploading}>
                Cancel
              </Button>
              <Button type="submit" disabled={selectedFiles.length === 0 || isUploading}>
                {isUploading ? "Starting Upload..." : "Upload Photos"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <UploadProgressToast
        files={Object.entries(uploadProgress).map(([name, progress]) => ({
          name,
          progress,
          error: uploadErrors[name]
        }))}
        totalFiles={totalSelectedFiles}
        isComplete={isUploadComplete}
        onRemove={handleRemoveUpload}
      />
    </>
  )
}

