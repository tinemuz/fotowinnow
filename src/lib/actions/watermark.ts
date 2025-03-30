"use server";

import sharp from "sharp";
import path from 'path';
import { Space_Mono, Roboto_Mono, Source_Code_Pro, JetBrains_Mono, IBM_Plex_Mono, Cutive_Mono } from "next/font/google";
import { watermarkInputSchema } from "@/lib/utils/validation";
import { WatermarkResult } from "@/types/image";

// Configure font paths
path.resolve(process.cwd(), 'fonts', 'fonts.conf');
path.resolve(process.cwd(), 'fonts', 'CutiveMono-Regular.ttf');
path.resolve(process.cwd(), 'fonts', 'IBMPlexMono-Regular.ttf');
path.resolve(process.cwd(), 'fonts', 'JetBrainsMono-Regular.ttf');
path.resolve(process.cwd(), 'fonts', 'RobotoMono-Regular.ttf');
path.resolve(process.cwd(), 'fonts', 'SourceCodePro-Regular.ttf');
path.resolve(process.cwd(), 'fonts', 'SpaceMono-Regular.ttf');

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
};

export async function addWatermark(formData: FormData): Promise<WatermarkResult> {
    try {
        // Extract and validate the data
        const fileBase64 = formData.get('fileBase64') as string;
        const quality = formData.get('quality') as "512p" | "1080p" | "2K" | "4K";
        const watermark = formData.get('watermark') as string;
        const fontName = formData.get('fontName') as string;

        // Validate using zod
        const input = watermarkInputSchema.parse({
            fileBase64,
            quality,
            watermark,
            fontName
        });

        // ... existing code ...
        const fileBuffer = Buffer.from(input.fileBase64, 'base64');
        const image = sharp(fileBuffer, {
            failOnError: false,
        });

        const metadata = await image.metadata();
        const width = metadata.width ?? 0;
        const height = metadata.height ?? 0;

        const targetSize = {
            "512p": 512,
            "1080p": 1080,
            "2K": 1440,
            "4K": 2160,
        }[input.quality] ?? 512;

        const scaleFactor = targetSize / 512;
        const fontSize = Math.round(24 * scaleFactor); // Base font size: 24px

        const aspectRatio = width / height;
        const [newWidth, newHeight] = width > height
            ? [Math.round(targetSize * aspectRatio), targetSize]
            : [targetSize, Math.round(targetSize / aspectRatio)];

        const baseCharWidth = 14; // Base character width for 512p
        const charWidth = Math.round(baseCharWidth * scaleFactor);
        const watermarkWidth = input.watermark.length * charWidth;

        const horizontalSpacing = 2 * charWidth;
        const verticalSpacing = 2 * charWidth;

        const totalHorizontalSpace = watermarkWidth + horizontalSpacing;
        const totalVerticalSpace = fontSize + verticalSpacing;

        const diagonalLength = Math.ceil(Math.sqrt(newWidth * newWidth + newHeight * newHeight));
        const numCols = Math.ceil(diagonalLength / totalHorizontalSpace) + 2;
        const numRows = Math.ceil(diagonalLength / totalVerticalSpace) + 2;

        const fontFamily = fontFamilyMap[input.fontName as keyof typeof fontFamilyMap] ?? fontFamilyMap['Space Mono'];

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
                            >${input.watermark}</text>`
            ).join('')
        ).join('')}
                </g>
            </svg>
        `;

        const result = await image
            .resize(newWidth, newHeight, { fit: "fill" })
            .composite([{
                input: Buffer.from(svgContent),
                top: 0,
                left: 0,
                blend: "over",
            }])
            .png({ compressionLevel: 6 })
            .toBuffer();

        return { success: true, result: result.toString('base64') };
    } catch (error) {
        console.error("Error processing image:", error);
        return { success: false, error: "Error processing image" };
    }
} 