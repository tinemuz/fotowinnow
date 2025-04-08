'use client';

import React, { useState, useRef } from 'react';
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Progress } from "~/components/ui/progress";
import { toast } from "sonner";
import { Upload, CheckCircle2 } from "lucide-react";

interface UploadResponse {
  signedUrl: string;
  key: string;
  error?: string;
}

export default function FileUploader() {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFileKey, setUploadedFileKey] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset states
    setUploading(true);
    setUploadProgress(0);
    setUploadedFileKey(null);

    try {
      // 1. Get the pre-signed URL
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
        throw new Error(errorData.error ?? `Failed to get signed URL (${response.status})`);
      }

      const { signedUrl, key } = await response.json() as UploadResponse;

      // 2. Upload to R2 with progress tracking
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(progress);
        }
      });

      xhr.upload.addEventListener('load', () => {
        setUploadProgress(100);
        setUploadedFileKey(key);
        toast.success('File uploaded successfully!');
      });

      xhr.upload.addEventListener('error', () => {
        throw new Error('Upload failed');
      });

      xhr.open('PUT', signedUrl);
      xhr.setRequestHeader('Content-Type', file.type);
      xhr.send(file);

    } catch (error) {
      console.error("Upload failed:", error);
      if (error instanceof Error) {
        toast.error(error.message ?? 'An unknown error occurred during upload.');
      } else {
        toast.error('An unknown error occurred during upload.');
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="w-full max-w-md space-y-4">
      <div className="flex items-center gap-4">
        <Input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={uploading}
          ref={fileInputRef}
          className="cursor-pointer"
        />
        <Button 
          variant="outline" 
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="h-4 w-4 mr-2" />
          Upload
        </Button>
      </div>

      {uploading && (
        <div className="space-y-2">
          <Progress value={uploadProgress} className="w-full" />
          <p className="text-sm text-muted-foreground">
            Uploading... {uploadProgress}%
          </p>
        </div>
      )}

      {uploadedFileKey && (
        <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-500">
          <CheckCircle2 className="h-4 w-4" />
          <span>Upload complete!</span>
        </div>
      )}
    </div>
  );
} 