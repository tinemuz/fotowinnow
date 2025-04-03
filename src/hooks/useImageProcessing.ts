"use client";

import {useState} from "react";
import {addWatermark} from "@/lib/actions/watermark";
import {FONT_OPTIONS, MAX_WATERMARK_LENGTH, QUALITY_OPTIONS, QualityOption} from "@/lib/constants";

export const useImageProcessing = () => {
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [quality, setQuality] = useState<QualityOption | null>(null);
    const [watermark, setWatermark] = useState("");
    const [font, setFont] = useState<string>(FONT_OPTIONS[0]);
    const [error, setError] = useState("");
    const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            if (selectedFile.size > 10 * 1024 * 1024) {
                setError("File size must be less than 10MB");
                setFile(null);
                setPreview(null);
                return;
            }

            setError("");
            setFile(selectedFile);
            setPreview(URL.createObjectURL(selectedFile));
            setDownloadUrl(null);
        }
    };

    const handleSetWatermark = (text: string) => {
        if (text.length <= MAX_WATERMARK_LENGTH) {
            setWatermark(text);
            setError("");
        } else {
            setError(`Watermark text must be ${MAX_WATERMARK_LENGTH} characters or less`);
        }
    };

    const processImage = async () => {
        if (!file || !quality || !watermark || !font) {
            setError("All fields must be filled before submitting");
            return;
        }

        try {
            setError("");
            setIsProcessing(true);

            const fileBuffer = await file.arrayBuffer();
            const base64 = Buffer.from(fileBuffer).toString('base64');

            // Create FormData for server action
            const formData = new FormData();
            formData.append('fileBase64', base64);
            formData.append('quality', quality);
            formData.append('watermark', watermark);
            formData.append('fontName', font);

            // Call server action
            const response = await addWatermark(formData);

            if (!response.success || !response.result) {
                throw new Error(response.error || "Failed to process image");
            }

            const resultBase64: string = response.result;

            const binaryString = atob(resultBase64);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }

            const blob = new Blob([bytes], { type: "image/png" });
            const url = URL.createObjectURL(blob);
            setDownloadUrl(url);
        } catch (error) {
            console.error(error);
            setError("Error processing image.");
        } finally {
            setIsProcessing(false);
        }
    };

    return {
        file,
        preview,
        quality,
        watermark,
        font,
        error,
        downloadUrl,
        isProcessing,
        fontOptions: FONT_OPTIONS,
        qualityOptions: QUALITY_OPTIONS,
        maxWatermarkLength: MAX_WATERMARK_LENGTH,
        setQuality,
        setFont,
        handleFileChange,
        handleSetWatermark,
        processImage
    };
}; 