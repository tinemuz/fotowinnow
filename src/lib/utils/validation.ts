import { z } from "zod";
import { QUALITY_OPTIONS, MAX_WATERMARK_LENGTH } from "../constants";

export const watermarkInputSchema = z.object({
    fileBase64: z.string(),
    quality: z.enum(QUALITY_OPTIONS),
    watermark: z.string().min(1).max(MAX_WATERMARK_LENGTH),
    fontName: z.string(),
}); 