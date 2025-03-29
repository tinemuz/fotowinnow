import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import sharp from "sharp";

sharp.cache(false);

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
                const horizontalSpacing = 5 * charWidth;
                const verticalSpacing = 2 * charWidth;

                const totalHorizontalSpace = watermarkWidth + horizontalSpacing;
                const totalVerticalSpace = fontSize + verticalSpacing;

                const diagonalLength = Math.ceil(Math.sqrt(newWidth * newWidth + newHeight * newHeight));
                const numCols = Math.ceil(diagonalLength / totalHorizontalSpace) + 2;
                const numRows = Math.ceil(diagonalLength / totalVerticalSpace) + 2;

                const svgContent = `
                    <svg width="${newWidth}" height="${newHeight}">
                        <style>.watermark { font-family: ${input.fontName}; font-size: ${fontSize}px; fill: rgba(255, 255, 255, 0.3); }</style>
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

                return result.toString('base64');
            } catch (error) {
                console.error("Error processing image:", error);
                throw new Error("Error processing image");
            }
        }),
}); 