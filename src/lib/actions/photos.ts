'use server';

import { auth } from '@clerk/nextjs/server';
import { createSupabaseServerActionClient, createSupabaseAdminClient } from '../supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

// Define the Photo type
export interface Photo {
    id: string;
    album_id: string;
    uploader_id: string;
    storage_path_original: string;
    filename_original: string;
    mime_type: string | null;
    size_bytes: number | null;
    order_in_album: number | null;
    uploaded_at: string;
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
        if (!clerkUserId) {
            console.error('Authentication failed - No Clerk user ID found');
            return { success: false, error: 'Unauthorized: User not logged in.' };
        }

        // Extract and validate input
        const albumId = formData.get('albumId');
        const file = formData.get('file');

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
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .eq('clerk_user_id', clerkUserId)
            .single();

        if (profileError || !profile) {
            console.error('Profile query error:', profileError);
            return { success: false, error: 'User profile not found.' };
        }

        // Verify album ownership
        const { data: album, error: albumError } = await supabaseAdmin
            .from('albums')
            .select('owner_id')
            .eq('id', albumId)
            .single();

        if (albumError || !album) {
            console.error('Album query error:', albumError);
            return { success: false, error: 'Album not found.' };
        }

        if (album.owner_id !== profile.id) {
            console.error('Unauthorized album access:', {
                profileId: profile.id,
                albumOwnerId: album.owner_id
            });
            return { success: false, error: 'Unauthorized: You do not own this album.' };
        }

        // Generate unique filename and storage path
        const uniqueFilename = `${Date.now()}-${file.name}`;
        const storagePath = `${profile.id}/${albumId}/${uniqueFilename}`;

        // Upload to Supabase Storage
        const supabase = await createSupabaseServerActionClient();
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('photos')
            .upload(storagePath, file, {
                contentType: file.type,
                upsert: false
            });

        if (uploadError) {
            console.error('Storage upload error:', uploadError);
            return { success: false, error: 'Failed to upload file to storage.' };
        }

        // Get the next order_in_album value
        const { data: lastPhoto, error: orderError } = await supabase
            .from('photos')
            .select('order_in_album')
            .eq('album_id', albumId)
            .order('order_in_album', { ascending: false })
            .limit(1)
            .single();

        const nextOrder = (lastPhoto?.order_in_album ?? -1) + 1;

        // Insert photo record
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
            console.error('Database insert error:', dbError);
            // Attempt to delete the uploaded file if DB insert fails
            await supabase.storage
                .from('photos')
                .remove([uploadData.path]);
            return { success: false, error: 'Failed to save photo metadata to database.' };
        }

        // Revalidate the album page
        revalidatePath(`/dashboard/albums/${albumId}`);

        console.log('Photo uploaded successfully:', {
            photoId: newPhoto.id,
            albumId: albumId,
            storagePath: uploadData.path
        });

        return { success: true, photo: newPhoto as Photo };
    } catch (error) {
        console.error('Unexpected error in uploadPhoto:', error);
        return { success: false, error: 'An unexpected error occurred while uploading the photo.' };
    }
} 