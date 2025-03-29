import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import sharp from "sharp";
import fs from "fs";
import path from "path";

sharp.cache(false);

// Function to encode font as Base64
const encodeFontToBase64 = (fontPath: string): string => {
    try {
        const fontBuffer = fs.readFileSync(fontPath);
        return `data:font/ttf;base64,${fontBuffer.toString("base64")}`;
    } catch (error) {
        console.error("Error loading font:", error);
        return "";
    }
};

// Load font files dynamically
const fontsDirectory = path.join(process.cwd(), "public/fonts");
const fontFiles: Record<string, string> = {
    "Roboto Mono": encodeFontToBase64(path.join(fontsDirectory, "RobotoMono-VariableFont_wght.ttf")),
    // Add more fonts if needed
};

export const watermarkRouter = createTRPCRouter({
    addWatermark: publicProcedure
        .input(
            z.object({
                fileBase64: z.string(),
                quality: z.enum(["512p", "1080p", "2K", "4K"]),
                watermark: z.string().min(1).max(15),
                fontName: z.string(),
            })
        )
        .mutation(async ({ input }) => {
            try {
                const fileBuffer = Buffer.from(input.fileBase64, "base64");
                const image = sharp(fileBuffer, { failOnError: false });

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
                const fontSize = Math.round(24 * scaleFactor);
                const aspectRatio = width / height;
                const [newWidth, newHeight] =
                    width > height
                        ? [Math.round(targetSize * aspectRatio), targetSize]
                        : [targetSize, Math.round(targetSize / aspectRatio)];

                const baseCharWidth = 14;
                const charWidth = Math.round(baseCharWidth * scaleFactor);
                const watermarkWidth = input.watermark.length * charWidth;
                const horizontalSpacing = 2 * charWidth;
                const verticalSpacing = 2 * charWidth;
                const totalHorizontalSpace = watermarkWidth + horizontalSpacing;
                const totalVerticalSpace = fontSize + verticalSpacing;
                const diagonalLength = Math.ceil(Math.sqrt(newWidth ** 2 + newHeight ** 2));
                const numCols = Math.ceil(diagonalLength / totalHorizontalSpace) + 2;
                const numRows = Math.ceil(diagonalLength / totalVerticalSpace) + 2;

                // Load font as base64
                const fontBase64 = fontFiles[input.fontName] ?? "";
                const svgFontFace = fontBase64
                    ? `
                    @font-face {
                        font-family: '${input.fontName}';
                        src: url('${fontBase64}') format('truetype');
                    }`
                    : "";

                // Generate SVG with embedded font
                const svgContent = `
                    <svg width="${newWidth}" height="${newHeight}" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <style>
                                ${svgFontFace}
                                .watermark { 
                                    font-family: '${input.fontName}', monospace; 
                                    font-size: ${fontSize}px; 
                                    fill: rgba(255, 255, 255, 0.3);
                                }
                            </style>
                        </defs>
                        <g transform="translate(${newWidth / 2}, ${newHeight / 2}) rotate(45) translate(${-diagonalLength / 2}, ${-diagonalLength / 2})">
                            ${Array.from({ length: numRows }, (_, row) =>
                    Array.from({ length: numCols }, (_, col) =>
                        `<text 
                            x="${col * totalHorizontalSpace + (row % 2 ? totalHorizontalSpace / 2 : 0)}" 
                            y="${row * totalVerticalSpace}" 
                            class="watermark"
                        >${input.watermark}</text>`
                    ).join("")
                ).join("")}
                        </g>
                    </svg>
                `;

                const result = await image
                    .resize(newWidth, newHeight, { fit: "fill" })
                    .composite([{ input: Buffer.from(svgContent), top: 0, left: 0, blend: "over" }])
                    .png({ compressionLevel: 6 })
                    .toBuffer();

                return result.toString("base64");
            } catch (error) {
                console.error("Error processing image:", error);
                throw new Error("Error processing image");
            }
        }),
});
