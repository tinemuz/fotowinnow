-- Migration: Update watermark settings
-- Description: Add font selection and update quality options for watermarks

-- Update watermark_quality column to use new quality options
ALTER TABLE "fotowinnow_album" ALTER COLUMN "watermark_quality" SET DEFAULT '1080p';
ALTER TABLE "fotowinnow_album" 
    ALTER COLUMN "watermark_quality" TYPE text,
    ALTER COLUMN "watermark_quality" SET DEFAULT '1080p';

-- Add watermark_font column
ALTER TABLE "fotowinnow_album" ADD COLUMN IF NOT EXISTS "watermark_font" text DEFAULT 'Space Mono';

-- Update existing records to use new defaults
UPDATE "fotowinnow_album" 
SET watermark_quality = '1080p' 
WHERE watermark_quality NOT IN ('512p', '1080p', '2K', '4K');

UPDATE "fotowinnow_album" 
SET watermark_font = 'Space Mono' 
WHERE watermark_font IS NULL; 