import { z } from "zod";
import { watermarkInputSchema } from "@/lib/utils/validation";

export type WatermarkInput = z.infer<typeof watermarkInputSchema>;

export interface WatermarkResult {
    success: boolean;
    result?: string;
    error?: string;
} 