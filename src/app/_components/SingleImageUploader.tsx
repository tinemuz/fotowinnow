"use client";

import React, { useState } from "react";
import { Download } from "lucide-react";
import { addWatermark } from "../actions/watermark";

const SingleImageUploader = () => {
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [quality, setQuality] = useState<string | null>(null);
    const [watermark, setWatermark] = useState("");
    const [font, setFont] = useState<string>("Space Mono");
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

    const handleWatermark = async () => {
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
            formData.append('quality', quality as "512p" | "1080p" | "2K" | "4K");
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

    return (
        <div className="flex flex-col items-center justify-center w-full max-w-md mx-auto pt-8">
            <div className="aspect-square flex justify-center items-center w-full bg-gray-200 rounded-lg cursor-pointer overflow-hidden">
                <label className="flex flex-col items-center w-full h-full justify-center cursor-pointer relative">
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                    />
                    {preview ? (
                        <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                        <span className="text-gray-600">Upload Image</span>
                    )}
                </label>
            </div>

            {file && (
                <div className="mt-4 p-3 bg-gray-100 rounded-lg w-full">
                    <p className="text-sm font-semibold">File details:</p>
                    <ul className="text-xs">
                        <li>Name: {file.name}</li>
                        <li>Type: {file.type}</li>
                        <li>Size: {(file.size / 1024).toFixed(2)} KB</li>
                    </ul>
                </div>
            )}

            <div className="mt-4">
                <div className="flex gap-8">
                    {["512p", "1080p", "2K", "4K"].map((q) => (
                        <label key={q} className="flex flex-col items-center gap-3 text-sm cursor-pointer">
                            <span>{q}</span>
                            <input
                                type="radio"
                                name="quality"
                                value={q}
                                onChange={(e) => setQuality(e.target.value)}
                                className="appearance-none size-1 checked:size-2 bg-gray-300 rounded-full checked:bg-gray-800 checked:border-gray-800 transition cursor-pointer"
                            />
                        </label>
                    ))}
                </div>
            </div>

            <div className="mt-4 w-full">
                <p className="text-sm pb-1">Watermark Text:</p>
                <input
                    type="text"
                    value={watermark}
                    onChange={(e) => {
                        const text = e.target.value;
                        if (text.length <= 15) {
                            setWatermark(text);
                            setError("");
                        } else {
                            setError("Watermark text must be 15 characters or less");
                        }
                    }}
                    placeholder="Enter watermark text"
                    className="w-full border border-gray-300 p-2 rounded-lg"
                    maxLength={15}
                />
            </div>

            <div className="mt-4 w-full">
                <p className="text-sm pb-1">Select Font:</p>
                <select
                    className="w-full border border-gray-300 p-2 rounded-lg"
                    onChange={(e) => setFont(e.target.value)}
                    defaultValue="Space Mono"
                >
                    {[
                        "Space Mono",
                        "Roboto Mono",
                        "Source Code Pro",
                        "JetBrains Mono",
                        "IBM Plex Mono",
                        "Cutive Mono"
                    ].map((f) => (
                        <option key={f} value={f}>
                            {f}
                        </option>
                    ))}
                </select>
            </div>

            {error && <p className="mt-4 text-red-500 text-sm">{error}</p>}

            <div className="mt-6 flex items-center gap-4">
                <button
                    onClick={handleWatermark}
                    disabled={isProcessing}
                    className={`px-6 py-2 ease-in-out duration-200 rounded-full ${
                        isProcessing 
                            ? "bg-gray-500 cursor-not-allowed" 
                            : "bg-black/90 hover:bg-black hover:drop-shadow-lg shadow-black"
                    } text-white`}
                >
                    {isProcessing ? "Processing..." : "Add Watermark"}
                </button>

                {downloadUrl && (
                    <a
                        href={downloadUrl}
                        download="watermarked_image.png"
                        className="p-3 bg-green-600 text-white ease-in-out duration-200 rounded-full hover:bg-green-700 shadow-lg flex items-center justify-center"
                    >
                        <Download size={20} />
                    </a>
                )}
            </div>
        </div>
    );
};

export default SingleImageUploader; 