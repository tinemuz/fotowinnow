'use server';

import { auth } from '@clerk/nextjs/server';
import { createSupabaseServerActionClient, createSupabaseAdminClient, getAuthenticatedProfileId } from '../supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { Album } from '@/types/database';
import { addWatermark } from '../actions/watermark';

const createAlbumSchema = z.object({
    name: z.string().min(1, 'Album name is required'),
    description: z.string().optional(),
    client_greeting: z.string().optional(),
    watermark_text: z.string().optional(),
});

export async function getAlbums(): Promise<Album[]> {
    console.log('Starting getAlbums process');
    const profileId = await getAuthenticatedProfileId();
    console.log('Retrieved profile ID:', profileId);

    const supabase = await createSupabaseServerActionClient();
    console.log('Supabase client created, querying albums');

    // Get the albums
    const { data: albums, error: albumsError } = await supabase
        .from('albums')
        .select('*')
        .eq('owner_id', profileId)
        .order('created_at', { ascending: false });

    if (albumsError) {
        console.error('Error fetching albums:', {
            error: albumsError,
            profileId,
            query: 'albums.select(*).eq(owner_id, profileId).order(created_at, { ascending: false })'
        });
        throw new Error('Failed to fetch albums');
    }

    console.log('Successfully retrieved albums:', {
        count: albums?.length ?? 0,
        profileId
    });
    return albums || [];
}

export async function getAlbum(albumId: string): Promise<Album | null> {
    console.log('Starting getAlbum process');
    const profileId = await getAuthenticatedProfileId();
    console.log('Retrieved profile ID:', profileId);

    const supabase = await createSupabaseServerActionClient();
    console.log('Supabase client created, querying album');

    const { data: album, error: albumError } = await supabase
        .from('albums')
        .select('*')
        .eq('id', albumId)
        .eq('owner_id', profileId)
        .single();

    if (albumError) {
        console.error('Error fetching album:', {
            error: albumError,
            albumId,
            profileId
        });
        return null;
    }

    return album;
}

// Define expected return type for better type safety
type CreateAlbumResult =
    | { success: true; data: Album }
    | { success: false; error: string; details?: Record<string, string[]> };

export async function createAlbum(formData: FormData): Promise<CreateAlbumResult> {
    console.log('Starting createAlbum process');
    try {
        const profileId = await getAuthenticatedProfileId();
        console.log('Retrieved profile ID:', profileId);

        const supabase = await createSupabaseServerActionClient();
        console.log('Supabase client created');

        // Parse and validate the form data
        const rawData = {
            name: formData.get('name'),
            description: formData.get('description'),
            client_greeting: formData.get('client_greeting'),
            watermark_text: formData.get('watermark_text') || 'fotowinnow',
        };

        console.log('Raw form data:', {
            nameLength: rawData.name?.toString().length,
            descriptionLength: rawData.description?.toString().length,
            clientGreetingLength: rawData.client_greeting?.toString().length,
            watermarkTextLength: rawData.watermark_text?.toString().length
        });

        // Validate using safeParse for better error handling
        const validationResult = createAlbumSchema.safeParse(rawData);
        if (!validationResult.success) {
            console.error("Validation Error:", {
                error: validationResult.error.flatten(),
                rawData
            });
            return {
                success: false,
                error: 'Invalid input data',
                details: validationResult.error.flatten().fieldErrors,
            };
        }

        console.log('Form data validation successful');
        const validatedData = validationResult.data;

        // Create the album
        const { data: album, error: createError } = await supabase
            .from('albums')
            .insert([
                {
                    owner_id: profileId,
                    name: validatedData.name,
                    description: validatedData.description || null,
                    client_greeting: validatedData.client_greeting || null,
                    watermark_text: validatedData.watermark_text || 'fotowinnow',
                    status: 'draft',
                    current_review_cycle: 0,
                }
            ])
            .select()
            .single();

        if (createError) {
            console.error('Error creating album:', {
                error: createError,
                profileId,
                albumData: {
                    name: validatedData.name,
                    hasDescription: !!validatedData.description,
                    hasClientGreeting: !!validatedData.client_greeting,
                    hasWatermarkText: !!validatedData.watermark_text
                }
            });
            return {
                success: false,
                error: 'Failed to create album in database',
            };
        }

        if (!album) {
            console.error('Album creation failed - No data returned:', {
                profileId,
                validatedData
            });
            return {
                success: false,
                error: 'Album was not created',
            };
        }

        console.log('Album created successfully:', {
            albumId: album.id,
            name: album.name,
            status: album.status
        });

        // Revalidate the albums page
        revalidatePath('/dashboard/albums');
        console.log('Cache revalidated for /dashboard/albums');

        return {
            success: true,
            data: album,
        };
    } catch (error) {
        console.error('Unexpected error in createAlbum:', {
            error,
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined
        });
        return {
            success: false,
            error: 'An unexpected error occurred while creating the album',
        };
    }
}

export async function applyAlbumWatermark(albumId: string): Promise<{
    success: boolean;
    error?: string;
    processed?: number;
    errors?: number;
}> {
    console.log('Starting applyAlbumWatermark process');
    const profileId = await getAuthenticatedProfileId();
    console.log('Retrieved profile ID:', profileId);

    const supabase = await createSupabaseServerActionClient();
    console.log('Supabase client created');

    // Get album details including watermark text
    const { data: album, error: albumError } = await supabase
        .from('albums')
        .select('*')
        .eq('id', albumId)
        .eq('owner_id', profileId)
        .single();

    if (albumError || !album) {
        console.error('Error fetching album:', {
            error: albumError,
            albumId,
            profileId
        });
        return {
            success: false,
            error: 'Album not found or access denied'
        };
    }

    // Get all unwatermarked photos for this album
    const { data: photos, error: photosError } = await supabase
        .from('photos')
        .select('*')
        .eq('album_id', albumId)
        .is('storage_path_watermarked', null);

    if (photosError) {
        console.error('Error fetching photos:', {
            error: photosError,
            albumId
        });
        return {
            success: false,
            error: 'Failed to fetch photos'
        };
    }

    if (!photos || photos.length === 0) {
        return {
            success: true,
            error: 'No photos need watermarking'
        };
    }

    try {
        // Process photos in batches to avoid timeout
        const batchSize = 5;
        const batches = [];
        for (let i = 0; i < photos.length; i += batchSize) {
            batches.push(photos.slice(i, i + batchSize));
        }

        let totalProcessed = 0;
        let totalErrors = 0;
        const watermarkText = album.watermark_text || 'fotowinnow';

        for (const batch of photos) {
            try {
                console.log(`Processing photo ${totalProcessed + 1}/${photos.length}: ${batch.id}`);

                // Get the original image from storage
                const { data: imageData, error: imageError } = await supabase
                    .storage
                    .from('photos')
                    .download(batch.storage_path_original);

                if (imageError) {
                    console.error(`Error downloading image for photo ${batch.id}:`, imageError);
                    totalErrors++;
                    continue;
                }

                // Convert to base64
                const arrayBuffer = await imageData.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);
                const base64String = buffer.toString('base64');

                // Create FormData for watermark function
                const formData = new FormData();
                formData.append('fileBase64', base64String);
                formData.append('quality', '1080p'); // Default quality
                formData.append('watermark', watermarkText);
                formData.append('fontName', 'Space Mono'); // Default font

                console.log('Applying watermark to photo:', {
                    photoId: batch.id,
                    watermarkText: watermarkText
                });

                // Apply watermark using the existing function
                const watermarkResult = await addWatermark(formData);

                if (!watermarkResult.success || !watermarkResult.result) {
                    console.error('Watermark failed for photo:', {
                        photoId: batch.id,
                        error: watermarkResult.error
                    });
                    totalErrors++;
                    continue;
                }

                console.log('Successfully applied watermark to photo:', {
                    photoId: batch.id,
                    resultSize: watermarkResult.result.length
                });

                // Convert base64 result back to buffer
                const watermarkedBuffer = Buffer.from(watermarkResult.result, 'base64');

                // Generate watermarked path
                const watermarkedPath = batch.storage_path_original.replace(
                    /\.(jpg|jpeg|png|webp)$/i,
                    '_watermarked.$1'
                );

                console.log('Uploading watermarked image:', {
                    photoId: batch.id,
                    watermarkedPath
                });

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
                        photoId: batch.id,
                        error: uploadError
                    });
                    totalErrors++;
                    continue;
                }

                // Update photo record with watermarked path and size
                const { error: updateError } = await supabase
                    .from('photos')
                    .update({
                        storage_path_watermarked: watermarkedPath,
                        watermarked_size_bytes: watermarkedBuffer.length
                    })
                    .eq('id', batch.id);

                if (updateError) {
                    console.error('Error updating photo record:', {
                        photoId: batch.id,
                        error: updateError
                    });
                    totalErrors++;
                    continue;
                }

                totalProcessed++;
            } catch (photoError) {
                console.error(`Error processing photo ${batch.id}:`, {
                    error: photoError,
                    errorMessage: photoError instanceof Error ? photoError.message : 'Unknown error',
                    stack: photoError instanceof Error ? photoError.stack : undefined
                });
                totalErrors++;
            }
        }

        // Revalidate the album page to refresh the UI
        revalidatePath(`/dashboard/albums/${albumId}`);
        console.log('Cache revalidated for album page');

        return {
            success: true,
            processed: totalProcessed,
            errors: totalErrors
        };
    } catch (error) {
        console.error('Exception during watermark process:', {
            error,
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined
        });
        return {
            success: false,
            error: 'Exception during watermark process'
        };
    }
}
