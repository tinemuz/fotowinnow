import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import sharp from "sharp";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from 'uuid';
import {
    Cutive_Mono,
    IBM_Plex_Mono,
    JetBrains_Mono,
    Roboto_Mono,
    Source_Code_Pro,
    Space_Mono
} from "next/font/google";
import * as path from "node:path";

// Environment variable validation
if (!process.env.R2_ENDPOINT) throw new Error('R2_ENDPOINT is required');
if (!process.env.R2_ACCESS_KEY_ID) throw new Error('R2_ACCESS_KEY_ID is required');
if (!process.env.R2_SECRET_ACCESS_KEY) throw new Error('R2_SECRET_ACCESS_KEY is required');
if (!process.env.R2_BUCKET_NAME) throw new Error('R2_BUCKET_NAME is required');

const R2_CONFIG = {
    endpoint: process.env.R2_ENDPOINT,
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    bucketName: process.env.R2_BUCKET_NAME,
} as const;

// Set environment variables for production
if (process.env.NODE_ENV === 'production') {
    process.env.FONTCONFIG_PATH = '/var/task/fonts';
    process.env.LD_LIBRARY_PATH = '/var/task';
}

// Disable sharp cache for serverless environment
sharp.cache(false);

// Configure font paths
path.resolve(process.cwd(), 'fonts', 'fonts.conf');
path.resolve(process.cwd(), 'fonts', 'CutiveMono-Regular.ttf');
path.resolve(process.cwd(), 'fonts', 'IBMPlexMono-Regular.ttf');
path.resolve(process.cwd(), 'fonts', 'JetBrainsMono-Regular.ttf');
path.resolve(process.cwd(), 'fonts', 'RobotoMono-Regular.ttf');
path.resolve(process.cwd(), 'fonts', 'SourceCodePro-Regular.ttf');
path.resolve(process.cwd(), 'fonts', 'SpaceMono-Regular.ttf');

// Load fonts
const spaceMono = Space_Mono({ weight: '400', subsets: ['latin'] });
const robotoMono = Roboto_Mono({ weight: '400', subsets: ['latin'] });
const sourceCodePro = Source_Code_Pro({ weight: '400', subsets: ['latin'] });
const jetBrainsMono = JetBrains_Mono({ weight: '400', subsets: ['latin'] });
const ibmPlexMono = IBM_Plex_Mono({ weight: '400', subsets: ['latin'] });
const cutiveMono = Cutive_Mono({ weight: '400', subsets: ['latin'] });

const fontFamilyMap = {
    'Space Mono': spaceMono.style.fontFamily,
    'Roboto Mono': robotoMono.style.fontFamily,
    'Source Code Pro': sourceCodePro.style.fontFamily,
    'JetBrains Mono': jetBrainsMono.style.fontFamily,
    'IBM Plex Mono': ibmPlexMono.style.fontFamily,
    'Cutive Mono': cutiveMono.style.fontFamily
} as const;

// Initialize S3 client with proper typing
const s3Client = new S3Client({
    region: "auto",
    endpoint: R2_CONFIG.endpoint,
    credentials: {
        accessKeyId: R2_CONFIG.accessKeyId,
        secretAccessKey: R2_CONFIG.secretAccessKey,
    },
});

interface ProcessImageRequest {
    key: string;
    watermark: string;
    quality: "512p" | "1080p" | "2K" | "4K";
    fontName: keyof typeof fontFamilyMap;
}

const QUALITY_DIMENSIONS = {
    "512p": { width: 910, height: 512 },
    "1080p": { width: 1920, height: 1080 },
    "2K": { width: 2560, height: 1440 },
    "4K": { width: 3840, height: 2160 },
} as const;

export async function POST(req: NextRequest) {
    try {
        // 1. Authenticate the user
        console.log('Starting image processing request');
        const authResult = await auth();
        const userId = authResult.userId;
        if (!userId) {
            console.warn('Unauthorized: No userId in auth result');
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 2. Parse request body
        const body = await req.json() as ProcessImageRequest;
        const { key, watermark, quality = "1080p", fontName = "Space Mono" } = body;

        console.log('Received processing request:', {
            key,
            watermarkLength: watermark?.length,
            quality,
            fontName
        });

        // Validate required fields
        if (!key) {
            console.warn('Missing key in request body');
            return NextResponse.json({ error: "Missing key" }, { status: 400 });
        }

        // Validate quality option
        if (!QUALITY_DIMENSIONS[quality]) {
            console.warn('Invalid quality option:', quality);
            return NextResponse.json({
                error: "Invalid quality option. Must be one of: 512p, 1080p, 2K, 4K"
            }, { status: 400 });
        }

        // 3. Get the original image from R2
        console.log('Fetching original image from R2:', { key });
        const getCommand = new GetObjectCommand({
            Bucket: R2_CONFIG.bucketName,
            Key: key,
        });

        console.log('R2 configuration:', {
            bucket: R2_CONFIG.bucketName,
            endpoint: R2_CONFIG.endpoint,
            hasAccessKey: true,
            hasSecretKey: true
        });

        const object = await s3Client.send(getCommand);
        if (!object.Body) {
            console.warn('Image not found in R2:', { key });
            return NextResponse.json({ error: "File not found" }, { status: 404 });
        }
        console.log('Successfully retrieved image from R2:', {
            contentType: object.ContentType,
            contentLength: object.ContentLength
        });

        // Convert object.Body to Buffer
        const chunks: Uint8Array[] = [];
        for await (const chunk of object.Body as AsyncIterable<Uint8Array>) {
            chunks.push(chunk);
        }
        const buffer = Buffer.concat(chunks);

        // Get image metadata
        const metadata = await sharp(buffer).metadata();
        const originalWidth = metadata.width ?? 0;
        const originalHeight = metadata.height ?? 0;

        if (originalWidth === 0 || originalHeight === 0) {
            return NextResponse.json({ error: "Invalid image dimensions" }, { status: 400 });
        }

        // Calculate target dimensions based on quality setting while maintaining aspect ratio
        const targetDimensions = QUALITY_DIMENSIONS[quality];
        console.log('Target dimensions:', {
            quality,
            targetDimensions,
            originalWidth,
            originalHeight
        });

        const originalAspectRatio = originalWidth / originalHeight;
        const targetAspectRatio = targetDimensions.width / targetDimensions.height;

        // Calculate new dimensions based on aspect ratio
        const aspectRatio = originalWidth / originalHeight;
        const [newWidth, newHeight] = originalWidth > originalHeight
            ? [Math.round(targetDimensions.width * aspectRatio), targetDimensions.width]
            : [targetDimensions.width, Math.round(targetDimensions.width / aspectRatio)];

        console.log('Calculated dimensions:', {
            aspectRatio,
            newWidth,
            newHeight
        });

        // 4. Process the image - optimize and create webp version
        const optimizedImage = await sharp(buffer)
            .resize(newWidth, newHeight, {
                fit: 'fill',  // Changed to fill to match working implementation
                withoutEnlargement: true,
                background: { r: 0, g: 0, b: 0, alpha: 0 }
            })
            .webp({ quality: 80 })
            .toBuffer();

        // Generate unique keys for the processed images
        const filenameParts = key.split('/');
        const basePath = filenameParts.slice(0, -1).join('/');
        const optimizedKey = `${basePath}/optimized_${uuidv4()}.webp`;
        const watermarkedKey = `${basePath}/watermarked_${uuidv4()}.webp`;

        // 5. Upload optimized version
        const optimizedCommand = new PutObjectCommand({
            Bucket: R2_CONFIG.bucketName,
            Key: optimizedKey,
            Body: optimizedImage,
            ContentType: 'image/webp',
            Metadata: { 'user-id': userId }
        });
        await s3Client.send(optimizedCommand);

        // 6. Create and upload watermarked version
        const targetSize = targetDimensions.width; // Use the width as our base size

        const scaleFactor = targetSize / 512;
        const fontSize = Math.round(24 * scaleFactor);
        console.log('Watermark settings:', {
            scaleFactor,
            fontSize,
            fontFamily: fontFamilyMap[fontName]
        });

        const baseCharWidth = 14; // Base character width for 512p
        const charWidth = Math.round(baseCharWidth * scaleFactor);
        const watermarkWidth = watermark.length * charWidth;

        // Increase horizontal spacing to 4 characters while keeping vertical at 2
        const horizontalSpacing = 4 * charWidth; // Increased from 2 to 4
        const verticalSpacing = 2 * charWidth;  // Keep vertical spacing the same

        const totalHorizontalSpace = watermarkWidth + horizontalSpacing;
        const totalVerticalSpace = fontSize + verticalSpacing;

        // Calculate diagonal length with extra padding to ensure full coverage
        const diagonalLength = Math.ceil(Math.sqrt(
            (newWidth * newWidth) + (newHeight * newHeight)
        )) + Math.max(totalHorizontalSpace, totalVerticalSpace) * 2;

        // Increase the number of rows and columns to ensure full coverage
        const numCols = Math.ceil(diagonalLength / totalHorizontalSpace) + 4;
        const numRows = Math.ceil(diagonalLength / totalVerticalSpace) + 4;

        console.log('Watermark pattern calculations:', {
            targetDimensions,
            scaleFactor,
            charWidth,
            watermarkWidth,
            horizontalSpacing: `${4} chars (${horizontalSpacing}px)`, // Updated log
            verticalSpacing: `${2} chars (${verticalSpacing}px)`,
            totalHorizontalSpace,
            totalVerticalSpace,
            diagonalLength,
            numCols,
            numRows,
            imageDimensions: { width: newWidth, height: newHeight }
        });

        const fontFamily = fontFamilyMap[fontName] ?? fontFamilyMap['Space Mono'];

        const svgContent = `
            <svg width="${newWidth}" height="${newHeight}">
                <style>.watermark { font-family: ${fontFamily}; font-size: ${fontSize}px; fill: rgba(255, 255, 255, 0.3); }</style>
                <g transform="translate(${newWidth / 2}, ${newHeight / 2}) rotate(45) translate(${-diagonalLength / 2}, ${-diagonalLength / 2})">
                    ${Array.from({ length: numRows }, (_, row) =>
            Array.from({ length: numCols }, (_, col) =>
                `<text 
                                x="${col * totalHorizontalSpace + (row % 2 ? totalHorizontalSpace / 2 : 0)}" 
                                y="${row * totalVerticalSpace}" 
                                class="watermark"
                            >${watermark}</text>`
            ).join('')
        ).join('')}
                </g>
            </svg>
        `;

        const watermarkedImage = await sharp(optimizedImage)
            .resize(newWidth, newHeight, { fit: "fill" })  // Changed to fill to match working implementation
            .composite([{
                input: Buffer.from(svgContent),
                top: 0,
                left: 0,
                blend: 'over',
            }])
            .webp({
                quality: 80,
                effort: 6,
                lossless: false
            })
            .toBuffer();

        const watermarkedCommand = new PutObjectCommand({
            Bucket: R2_CONFIG.bucketName,
            Key: watermarkedKey,
            Body: watermarkedImage,
            ContentType: 'image/webp',
            Metadata: { 'user-id': userId }
        });
        await s3Client.send(watermarkedCommand);

        // 7. Return the new URLs
        return NextResponse.json({
            optimizedUrl: `/api/images/${optimizedKey}`,
            watermarkedUrl: `/api/images/${watermarkedKey}`,
        });

    } catch (error) {
        console.error("Error processing image:", error);
        return NextResponse.json(
            { error: "Failed to process image" },
            { status: 500 }
        );
    }
} 