import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import sharp from "sharp";

// Configure sharp for better performance
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
                // Convert base64 to buffer
                const fileBuffer = Buffer.from(input.fileBase64, 'base64');

                // Process image with Sharp
                let image = sharp(fileBuffer, {
                    failOnError: false, // More resilient to malformed images
                });

                // Get image metadata
                const metadata = await image.metadata();
                const width = metadata.width ?? 0;
                const height = metadata.height ?? 0;

                // Calculate target size based on quality
                const targetSize = {
                    "512p": 512,
                    "1080p": 1080,
                    "2K": 1440,
                    "4K": 2160,
                }[input.quality] ?? 512;

                // Calculate new dimensions maintaining aspect ratio
                const aspectRatio = width / height;
                const [newWidth, newHeight] = width > height
                    ? [Math.round(targetSize * aspectRatio), targetSize]
                    : [targetSize, Math.round(targetSize / aspectRatio)];

                // Calculate the size of each watermark and spacing
                const charWidth = 14; // Approximate width of each character in pixels
                const watermarkWidth = input.watermark.length * charWidth;
                const horizontalSpacing = 5 * charWidth; // 5 characters worth of space
                const verticalSpacing = 2 * charWidth; // 2 characters worth of space

                // Calculate how many watermarks we can fit in each row and column
                const totalHorizontalSpace = watermarkWidth + horizontalSpacing;
                const totalVerticalSpace = 24 + verticalSpacing; // 24 is font size + vertical spacing

                // Calculate grid dimensions to cover the image even when rotated
                // We need to cover a larger area due to 45-degree rotation
                const diagonalLength = Math.ceil(Math.sqrt(newWidth * newWidth + newHeight * newHeight));
                const numCols = Math.ceil(diagonalLength / totalHorizontalSpace) + 2;
                const numRows = Math.ceil(diagonalLength / totalVerticalSpace) + 2;

                // Create SVG with transformed grid
                const svgContent = `
                    <svg width="${newWidth}" height="${newHeight}">
                        <style>.watermark { font-family: ${input.fontName}; font-size: 24px; fill: rgba(255, 255, 255, 0.3); }</style>
                        <g transform="translate(${newWidth / 2}, ${newHeight / 2}) rotate(45) translate(${-diagonalLength / 2}, ${-diagonalLength / 2})">
                            ${Array.from({ length: numRows }, (_, row) =>
                    Array.from({ length: numCols }, (_, col) =>
                        `<text 
                                        x="${col * totalHorizontalSpace}" 
                                        y="${row * totalVerticalSpace}" 
                                        class="watermark"
                                    >${input.watermark}</text>`
                    ).join('')
                ).join('')}
                        </g>
                    </svg>
                `;

                // Resize image and add watermark in one operation
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

                // Convert result to base64
                return result.toString('base64');
            } catch (error) {
                console.error("Error processing image:", error);
                throw new Error("Error processing image");
            }
        }),
}); 