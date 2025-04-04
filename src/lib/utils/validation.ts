import {z} from "zod";
import {MAX_WATERMARK_LENGTH, QUALITY_OPTIONS} from "../constants";

export const watermarkInputSchema = z.object({
    fileBase64: z.string(),
    quality: z.enum(QUALITY_OPTIONS),
    watermark: z.string().min(1).max(MAX_WATERMARK_LENGTH),
    fontName: z.string(),
}); 