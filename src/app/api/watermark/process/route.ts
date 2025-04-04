import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { addWatermark } from '@/lib/actions/watermark';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { albumId, photos, watermarkText } = await request.json();
        console.log('Starting watermark process:', {
            albumId,
            totalPhotos: photos.length,
            watermarkText
        });

        const supabase = createSupabaseAdminClient();
        let processedCount = 0;
        let errorCount = 0;

        for (const photo of photos) {
            try {
                console.log('Processing photo:', {
                    photoId: photo.id,
                    storagePath: photo.storage_path,
                    progress: `${processedCount + 1}/${photos.length}`
                });

                // Download the original image
                const { data: imageData, error: downloadError } = await supabase
                    .storage
                    .from('photos')
                    .download(photo.storage_path);

                if (downloadError) {
                    console.error('Error downloading image:', {
                        error: downloadError,
                        photoId: photo.id,
                        storagePath: photo.storage_path
                    });
                    errorCount++;
                    continue;
                }

                // Convert ArrayBuffer to base64
                const base64Data = Buffer.from(await imageData.arrayBuffer()).toString('base64');
                const base64String = `data:${imageData.type};base64,${base64Data}`;

                // Create form data for watermark
                const formData = new FormData();
                formData.append('fileBase64', base64String);
                formData.append('quality', '1080p');
                formData.append('watermark', watermarkText);
                formData.append('fontName', 'Space Mono');

                // Apply watermark
                const watermarkResult = await addWatermark(formData);

                if (!watermarkResult.success || !watermarkResult.result) {
                    console.error('Watermark failed for photo:', {
                        photoId: photo.id,
                        error: watermarkResult.error
                    });
                    errorCount++;
                    continue;
                }

                // Convert base64 result back to buffer
                const watermarkedBuffer = Buffer.from(watermarkResult.result, 'base64');

                // Generate watermarked path
                const watermarkedPath = photo.storage_path.replace(
                    /\.(jpg|jpeg|png|webp)$/i,
                    '_watermarked.$1'
                );

                // Upload watermarked image
                const { error: uploadError } = await supabase
                    .storage
                    .from('photos')
                    .upload(watermarkedPath, watermarkedBuffer, {
                        contentType: imageData.type,
                        upsert: true
                    });

                if (uploadError) {
                    console.error('Error uploading watermarked image:', {
                        error: uploadError,
                        photoId: photo.id,
                        watermarkedPath
                    });
                    errorCount++;
                    continue;
                }

                // Update photo record with watermarked path
                const { error: updatePhotoError } = await supabase
                    .from('photos')
                    .update({
                        storage_path_watermarked: watermarkedPath,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', photo.id);

                if (updatePhotoError) {
                    console.error('Error updating photo record:', {
                        error: updatePhotoError,
                        photoId: photo.id,
                        watermarkedPath
                    });
                    errorCount++;
                    continue;
                }

                processedCount++;
                console.log('Successfully completed processing for photo:', {
                    photoId: photo.id,
                    processedCount,
                    totalPhotos: photos.length
                });
            } catch (error) {
                console.error('Error processing photo:', {
                    error,
                    errorMessage: error instanceof Error ? error.message : 'Unknown error',
                    stack: error instanceof Error ? error.stack : undefined,
                    photoId: photo.id
                });
                errorCount++;
            }
        }

        return NextResponse.json({
            success: true,
            processed: processedCount,
            errors: errorCount
        });
    } catch (error) {
        console.error('Error in watermark process:', {
            error,
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined
        });
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
} 