-- Migration: Add watermark settings to albums
-- Description: Add watermark text, quality, and opacity columns to the fotowinnow_album table

ALTER TABLE "fotowinnow_album" ADD COLUMN IF NOT EXISTS "watermark_text" text DEFAULT 'fotowinnow';
ALTER TABLE "fotowinnow_album" ADD COLUMN IF NOT EXISTS "watermark_quality" integer DEFAULT 80;
ALTER TABLE "fotowinnow_album" ADD COLUMN IF NOT EXISTS "watermark_opacity" integer DEFAULT 30; 