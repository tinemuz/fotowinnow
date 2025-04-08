import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import sharp from "sharp";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { Space_Mono } from "next/font/google";

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

// Load font
const spaceMono = Space_Mono({
    weight: '400',
    subsets: ['latin'],
    display: 'swap',
});

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
}

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
        const { key, watermark } = body;
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

        // 4. Process the image - optimize and create webp version
        const optimizedImage = await sharp(buffer)
            .resize(1920, 1080, { fit: 'inside', withoutEnlargement: true })
            .webp({ quality: 80 })
            .toBuffer();

        // Generate unique keys for the processed images
        const filenameParts = key.split('/');
        const basePath = filenameParts.join('/');

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
        const metadata = await sharp(optimizedImage).metadata();
        const width = metadata.width ?? 1920;
        const height = metadata.height ?? 1080;

        const fontSize = Math.round(24 * (width / 1920)); // Scale font size based on image width
        const watermarkWidth = watermark.length * (fontSize * 0.6); // Approximate character width

        const svgContent = `
            <svg width="${width}" height="${height}">
                <style>.watermark { font-family: ${spaceMono.style.fontFamily}; font-size: ${fontSize}px; fill: rgba(255, 255, 255, 0.3); }</style>
                <g transform="translate(${width / 2}, ${height / 2}) rotate(45) translate(${-width}, ${-height})">
                    ${Array.from({ length: Math.ceil(height * 2 / (fontSize * 2)) }, (_, row) =>
            Array.from({ length: Math.ceil(width * 2 / watermarkWidth) }, (_, col) =>
                `<text 
                                x="${col * watermarkWidth + (row % 2 ? watermarkWidth / 2 : 0)}" 
                                y="${row * fontSize * 2}" 
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
            .webp({ quality: 80 })
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