"use client";

import React from "react";
import {Download} from "lucide-react";
import {useImageProcessing} from "@/hooks/useImageProcessing";
import {QualityOption} from "@/lib/constants";
import {SignedIn, SignedOut} from "@clerk/nextjs";

const SingleImageUploader = () => {
    const {
        file,
        preview,
        error,
        downloadUrl,
        isProcessing,
        qualityOptions,
        fontOptions,
        handleFileChange,
        setQuality,
        watermark,
        handleSetWatermark,
        setFont,
        processImage
    } = useImageProcessing();

    return (
        <>
            <SignedIn>
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
                            {qualityOptions.map((q) => (
                                <label key={q} className="flex flex-col items-center gap-3 text-sm cursor-pointer">
                                    <span>{q}</span>
                                    <input
                                        type="radio"
                                        name="quality"
                                        value={q}
                                        onChange={(e) => setQuality(e.target.value as QualityOption)}
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
                            onChange={(e) => handleSetWatermark(e.target.value)}
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
                            defaultValue={fontOptions[0]}
                        >
                            {fontOptions.map((f) => (
                                <option key={f} value={f}>
                                    {f}
                                </option>
                            ))}
                        </select>
                    </div>

                    {error && <p className="mt-4 text-red-500 text-sm">{error}</p>}

                    <div className="mt-6 flex items-center gap-4">
                        <button
                            onClick={processImage}
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
            </SignedIn>
            <SignedOut>
                <div className="flex flex-col items-center justify-center w-full max-w-md mx-auto pt-8">
                    <p className="text-center text-gray-600">
                        Please sign in to use the watermark functionality.
                    </p>
                </div>
            </SignedOut>
        </>
    );
};

export default SingleImageUploader; 