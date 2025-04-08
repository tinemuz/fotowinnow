import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import sharp from "sharp";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import {
    Cutive_Mono,
    IBM_Plex_Mono,
    JetBrains_Mono,
    Roboto_Mono,
    Source_Code_Pro,
    Space_Mono
} from "next/font/google";

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

// Configure font paths
const fontsPath = path.resolve(process.cwd(), 'fonts');

// Set environment variables for production
if (process.env.NODE_ENV === 'production') {
    process.env.FONTCONFIG_PATH = '/var/task/fonts';
    process.env.LD_LIBRARY_PATH = '/var/task';
}

// Disable sharp cache for serverless environment
sharp.cache(false);

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
    "512p": 512,
    "1080p": 1080,
    "2K": 1440,
    "4K": 2160,
} as const;

export async function POST(req: NextRequest) {
    try {
        // 1. Authenticate the user
        console.log('Starting image processing request');
        const authResult = await auth();
        console.log('Auth result:', {
            userId: authResult?.userId,
            sessionId: authResult?.sessionId,
            sessionClaims: authResult?.sessionClaims
        });

        const userId = authResult.userId;
        if (!userId) {
            console.warn('Unauthorized: No userId in auth result');
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 2. Parse request body
        const body = await req.json() as ProcessImageRequest;
        const { key, watermark, quality = "1080p", fontName = "Space Mono" } = body;
        console.log('Received processing request:', { key, watermarkLength: watermark?.length });

        if (!key) {
            console.warn('Missing key in request body');
            return NextResponse.json({ error: "Missing key" }, { status: 400 });
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
        const width = metadata.width ?? 0;
        const height = metadata.height ?? 0;

        // Calculate target dimensions based on quality setting
        const targetSize = QUALITY_DIMENSIONS[quality];
        const aspectRatio = width / height;
        const [newWidth, newHeight] = width > height
            ? [Math.round(targetSize * aspectRatio), targetSize]
            : [targetSize, Math.round(targetSize / aspectRatio)];

        // 4. Process the image - optimize and create webp version
        const optimizedImage = await sharp(buffer)
            .resize(newWidth, newHeight, { fit: 'inside', withoutEnlargement: true })
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
        const scaleFactor = targetSize / 512;
        const fontSize = Math.round(24 * scaleFactor);
        const baseCharWidth = 14;
        const charWidth = Math.round(baseCharWidth * scaleFactor);
        const watermarkWidth = watermark.length * charWidth;

        const horizontalSpacing = 2 * charWidth;
        const verticalSpacing = 2 * charWidth;
        const totalHorizontalSpace = watermarkWidth + horizontalSpacing;
        const totalVerticalSpace = fontSize + verticalSpacing;

        const diagonalLength = Math.ceil(Math.sqrt(newWidth * newWidth + newHeight * newHeight));
        const numCols = Math.ceil(diagonalLength / totalHorizontalSpace) + 2;
        const numRows = Math.ceil(diagonalLength / totalVerticalSpace) + 2;

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