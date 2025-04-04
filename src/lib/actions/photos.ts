'use server';

import { auth } from '@clerk/nextjs/server';
import { createSupabaseServerActionClient, createSupabaseAdminClient, getAuthenticatedProfileId } from '../supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

// Define the Photo type
export interface Photo {
    id: string;
    album_id: string;
    uploader_id: string;
    storage_path_original: string;
    storage_path_watermarked: string | null;
    filename_original: string;
    mime_type: string | null;
    size_bytes: number | null;
    watermarked_size_bytes: number | null;
    order_in_album: number | null;
    uploaded_at: string;
    width: number | null;
    height: number | null;
    created_at: string;
}

// Define the result type
export type UploadPhotoResult =
    | { success: true; photo: Photo }
    | { success: false; error: string };

// Define validation schema for the file
const fileSchema = z.object({
    type: z.string().refine((type) =>
        ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(type),
        'File must be an image (JPEG, PNG, WebP, or GIF)'
    ),
    size: z.number().max(10 * 1024 * 1024, 'File size must be less than 10MB'),
});

export async function uploadPhoto(formData: FormData): Promise<UploadPhotoResult> {
    console.log('Starting uploadPhoto process');
    try {
        // Get authenticated user
        const { userId: clerkUserId } = await auth();
        console.log('Clerk User ID:', clerkUserId);

        if (!clerkUserId) {
            console.error('Authentication failed - No Clerk user ID found');
            return { success: false, error: 'Unauthorized: User not logged in.' };
        }

        // Extract and validate input
        const albumId = formData.get('albumId');
        const file = formData.get('file');

        console.log('Input validation:', {
            albumId,
            hasFile: file instanceof File,
            fileName: file instanceof File ? file.name : 'not a file',
            fileSize: file instanceof File ? file.size : 'not a file',
            fileType: file instanceof File ? file.type : 'not a file'
        });

        if (!albumId || !(file instanceof File)) {
            console.error('Invalid input:', { hasAlbumId: !!albumId, isFile: file instanceof File });
            return { success: false, error: 'Missing album ID or file.' };
        }

        // Validate file
        const fileValidation = fileSchema.safeParse({
            type: file.type,
            size: file.size
        });

        if (!fileValidation.success) {
            console.error('File validation failed:', fileValidation.error);
            return { success: false, error: fileValidation.error.errors[0].message };
        }

        // Get user's profile ID
        const supabaseAdmin = createSupabaseAdminClient();
        console.log('Fetching profile for Clerk user ID:', clerkUserId);

        const { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .eq('clerk_user_id', clerkUserId)
            .single();

        if (profileError || !profile) {
            console.error('Profile query error:', {
                error: profileError,
                clerkUserId,
                query: 'profiles.select(id).eq(clerk_user_id, userId).single()',
                errorDetails: {
                    code: profileError?.code,
                    message: profileError?.message,
                    details: profileError?.details,
                    hint: profileError?.hint
                }
            });
            return { success: false, error: 'User profile not found.' };
        }

        console.log('Profile found:', { profileId: profile.id });

        // Verify album ownership
        console.log('Verifying album ownership:', { albumId, profileId: profile.id });

        const { data: album, error: albumError } = await supabaseAdmin
            .from('albums')
            .select('owner_id')
            .eq('id', albumId)
            .single();

        if (albumError || !album) {
            console.error('Album query error:', {
                error: albumError,
                albumId,
                query: 'albums.select(owner_id).eq(id, albumId).single()',
                errorDetails: {
                    code: albumError?.code,
                    message: albumError?.message,
                    details: albumError?.details,
                    hint: albumError?.hint
                }
            });
            return { success: false, error: 'Album not found.' };
        }

        console.log('Album found:', { albumId, ownerId: album.owner_id });

        if (album.owner_id !== profile.id) {
            console.error('Unauthorized album access:', {
                profileId: profile.id,
                albumOwnerId: album.owner_id,
                albumId
            });
            return { success: false, error: 'Unauthorized: You do not own this album.' };
        }

        // Generate unique filename and storage path
        const uniqueFilename = `${Date.now()}-${file.name}`;
        const storagePath = `${profile.id}/${albumId}/${uniqueFilename}`;

        console.log('Preparing storage upload:', {
            storagePath,
            fileSize: file.size,
            fileType: file.type
        });

        // Upload to Supabase Storage
        const supabase = await createSupabaseServerActionClient();
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('photos')
            .upload(storagePath, file, {
                contentType: file.type,
                upsert: false
            });

        if (uploadError) {
            console.error('Storage upload error:', {
                error: uploadError,
                storagePath,
                errorDetails: {
                    message: uploadError.message,
                    name: uploadError.name
                }
            });
            return { success: false, error: 'Failed to upload file to storage.' };
        }

        console.log('File uploaded successfully:', { storagePath: uploadData.path });

        // Get the next order_in_album value
        console.log('Getting next order_in_album value for album:', albumId);

        const { data: lastPhoto, error: orderError } = await supabase
            .from('photos')
            .select('order_in_album')
            .eq('album_id', albumId)
            .order('order_in_album', { ascending: false })
            .limit(1)
            .single();

        if (orderError && orderError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
            console.error('Error getting next order:', orderError);
        }

        const nextOrder = (lastPhoto?.order_in_album ?? -1) + 1;
        console.log('Next order_in_album value:', nextOrder);

        // Insert photo record
        console.log('Inserting photo record:', {
            albumId,
            uploaderId: profile.id,
            storagePath: uploadData.path,
            filename: file.name,
            mimeType: file.type,
            size: file.size,
            order: nextOrder
        });

        const { data: newPhoto, error: dbError } = await supabase
            .from('photos')
            .insert({
                album_id: albumId,
                uploader_id: profile.id,
                storage_path_original: uploadData.path,
                filename_original: file.name,
                mime_type: file.type,
                size_bytes: file.size,
                order_in_album: nextOrder
            })
            .select()
            .single();

        if (dbError) {
            console.error('Database insert error:', {
                error: dbError,
                errorDetails: {
                    code: dbError.code,
                    message: dbError.message,
                    details: dbError.details,
                    hint: dbError.hint
                }
            });

            // Attempt to delete the uploaded file if DB insert fails
            console.log('Attempting to delete uploaded file after DB failure:', uploadData.path);
            await supabase.storage
                .from('photos')
                .remove([uploadData.path]);

            return { success: false, error: 'Failed to save photo metadata to database.' };
        }

        console.log('Photo record created successfully:', {
            photoId: newPhoto.id,
            albumId,
            storagePath: uploadData.path
        });

        // Revalidate the album page
        revalidatePath(`/dashboard/albums/${albumId}`);

        return { success: true, photo: newPhoto as Photo };
    } catch (error) {
        console.error('Unexpected error in uploadPhoto:', {
            error,
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined
        });
        return { success: false, error: 'An unexpected error occurred while uploading the photo.' };
    }
}

export async function getPhotos(albumId: string): Promise<Photo[]> {
    console.log('Starting getPhotos process for album:', albumId);
    try {
        const profileId = await getAuthenticatedProfileId();
        console.log('Retrieved profile ID:', profileId);

        const supabase = await createSupabaseServerActionClient();
        console.log('Supabase client created, verifying album ownership');

        // First verify album ownership
        const { data: album, error: albumError } = await supabase
            .from('albums')
            .select('owner_id')
            .eq('id', albumId)
            .single();

        if (albumError) {
            console.error('Album query error:', {
                error: albumError,
                albumId,
                errorDetails: {
                    code: albumError.code,
                    message: albumError.message,
                    details: albumError.details,
                    hint: albumError.hint
                }
            });
            return [];
        }

        if (!album) {
            console.error('Album not found:', albumId);
            return [];
        }

        console.log('Album found:', { albumId, ownerId: album.owner_id });

        if (album.owner_id !== profileId) {
            console.error('Unauthorized album access:', {
                profileId,
                albumOwnerId: album.owner_id,
                albumId
            });
            return [];
        }

        // Get the photos
        console.log('Fetching photos for album:', albumId);

        const { data: photos, error: photosError } = await supabase
            .from('photos')
            .select('*')
            .eq('album_id', albumId)
            .order('order_in_album', { ascending: true });

        if (photosError) {
            console.error('Error fetching photos:', {
                error: photosError,
                albumId,
                errorDetails: {
                    code: photosError.code,
                    message: photosError.message,
                    details: photosError.details,
                    hint: photosError.hint
                }
            });
            return [];
        }

        console.log('Photos fetched successfully:', {
            albumId,
            count: photos?.length || 0
        });

        return photos || [];
    } catch (error) {
        console.error('Unexpected error in getPhotos:', {
            error,
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined
        });
        return [];
    }
}

export async function getSignedUrls(storagePaths: string[]): Promise<{ [key: string]: string }> {
    console.log('Starting getSignedUrls process');
    try {
        const profileId = await getAuthenticatedProfileId();
        const supabase = await createSupabaseServerActionClient();

        // Verify ownership of all photos
        const { data: photos, error: photosError } = await supabase
            .from('photos')
            .select('storage_path_original, storage_path_watermarked, album_id')
            .or(`storage_path_original.in.(${storagePaths.join(',')}),storage_path_watermarked.in.(${storagePaths.join(',')})`);

        if (photosError) {
            console.error('Error fetching photos:', photosError);
            throw new Error('Failed to verify photo ownership');
        }

        // Get unique album IDs
        const albumIds = [...new Set(photos.map(photo => photo.album_id))];

        // Verify album ownership
        const { data: albums, error: albumsError } = await supabase
            .from('albums')
            .select('id, owner_id')
            .in('id', albumIds);

        if (albumsError) {
            console.error('Error fetching albums:', albumsError);
            throw new Error('Failed to verify album ownership');
        }

        // Check if user owns all albums
        const unauthorizedAlbums = albums.filter(album => album.owner_id !== profileId);
        if (unauthorizedAlbums.length > 0) {
            console.error('Unauthorized access to albums:', unauthorizedAlbums);
            throw new Error('Unauthorized access to photos');
        }

        // Generate signed URLs
        const { data: signedUrls, error: signedUrlsError } = await supabase
            .storage
            .from('photos')
            .createSignedUrls(storagePaths, 3600); // URLs valid for 1 hour

        if (signedUrlsError) {
            console.error('Error generating signed URLs:', signedUrlsError);
            throw new Error('Failed to generate signed URLs');
        }

        // Map storage paths to signed URLs
        const urlMap: { [key: string]: string } = {};
        signedUrls.forEach((signedUrl, index) => {
            if (signedUrl.signedUrl) {
                urlMap[storagePaths[index]] = signedUrl.signedUrl;
            }
        });

        return urlMap;
    } catch (error) {
        console.error('Unexpected error in getSignedUrls:', error);
        throw error;
    }
}

export async function deletePhoto(photoId: string): Promise<{ success: boolean; error?: string }> {
    console.log('Starting deletePhoto process for photoId:', photoId);
    try {
        const { userId: clerkUserId } = await auth();
        if (!clerkUserId) {
            console.error('Authentication failed - No Clerk user ID found');
            return { success: false, error: 'Unauthorized: User not logged in.' };
        }

        const supabaseAdmin = createSupabaseAdminClient();
        const supabase = await createSupabaseServerActionClient();

        // Get user's profile ID
        console.log('Fetching profile for Clerk user ID:', clerkUserId);
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .eq('clerk_user_id', clerkUserId)
            .single();

        if (profileError || !profile) {
            console.error('Profile query error:', profileError);
            return { success: false, error: 'User profile not found.' };
        }

        console.log('Profile found:', { profileId: profile.id });

        // Get photo details and verify ownership
        console.log('Fetching photo details for photoId:', photoId);
        const { data: photo, error: photoError } = await supabaseAdmin
            .from('photos')
            .select('*, albums!inner(owner_id)')
            .eq('id', photoId)
            .single();

        if (photoError || !photo) {
            console.error('Photo query error:', photoError);
            return { success: false, error: 'Photo not found.' };
        }

        console.log('Photo found:', {
            photoId,
            albumId: photo.album_id,
            albumOwnerId: photo.albums.owner_id,
            profileId: profile.id
        });

        if (photo.albums.owner_id !== profile.id) {
            console.error('Unauthorized photo access:', {
                profileId: profile.id,
                albumOwnerId: photo.albums.owner_id,
                photoId
            });
            return { success: false, error: 'Unauthorized: You do not own this photo.' };
        }

        // Delete from storage
        const storagePaths = [photo.storage_path_original];
        if (photo.storage_path_watermarked) {
            storagePaths.push(photo.storage_path_watermarked);
        }

        console.log('Deleting from storage:', storagePaths);
        const { error: storageError } = await supabase.storage
            .from('photos')
            .remove(storagePaths);

        if (storageError) {
            console.error('Storage deletion error:', storageError);
            return { success: false, error: 'Failed to delete photo from storage.' };
        }

        console.log('Storage deletion successful');

        // Delete from database
        console.log('Deleting from database:', photoId);
        const { error: dbError } = await supabase
            .from('photos')
            .delete()
            .eq('id', photoId);

        if (dbError) {
            console.error('Database deletion error:', dbError);
            return { success: false, error: 'Failed to delete photo from database.' };
        }

        console.log('Database deletion successful');

        // Verify the photo was actually deleted
        console.log('Verifying photo deletion...');
        const { data: verifyPhoto, error: verifyError } = await supabase
            .from('photos')
            .select('id')
            .eq('id', photoId)
            .single();

        if (verifyError && verifyError.code === 'PGRST116') {
            // PGRST116 is "no rows returned" which is what we want
            console.log('Verification successful: Photo record not found in database');
        } else if (verifyPhoto) {
            console.error('Verification failed: Photo record still exists in database', verifyPhoto);
            return { success: false, error: 'Photo record was not deleted from database.' };
        } else {
            console.error('Verification error:', verifyError);
            return { success: false, error: 'Failed to verify photo deletion.' };
        }

        // Revalidate the album page
        console.log('Revalidating album page:', photo.album_id);
        revalidatePath(`/dashboard/albums/${photo.album_id}`);

        console.log('Photo deletion completed successfully');
        return { success: true };
    } catch (error) {
        console.error('Unexpected error in deletePhoto:', error);
        return { success: false, error: 'An unexpected error occurred while deleting the photo.' };
    }
} 