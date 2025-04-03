'use server';

import { auth } from '@clerk/nextjs/server';
import { createSupabaseServerActionClient, createSupabaseAdminClient } from '../supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { Album } from '@/types/database';

const createAlbumSchema = z.object({
    name: z.string().min(1, 'Album name is required'),
    description: z.string().optional(),
    client_greeting: z.string().optional(),
});

async function getAuthenticatedProfileId() {
    const { userId } = await auth();
    console.log('Authentication attempt - Clerk User ID:', userId);

    if (!userId) {
        console.error('Authentication failed - No Clerk user ID found');
        throw new Error('User not authenticated');
    }

    // Use the admin client since we're just querying the profiles table
    const supabase = createSupabaseAdminClient();
    console.log('Supabase admin client created, querying profiles table for user:', userId);

    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('clerk_user_id', userId)
        .single();

    if (profileError) {
        console.error('Profile query error:', {
            error: profileError,
            clerkUserId: userId,
            query: 'profiles.select(id).eq(clerk_user_id, userId).single()',
            errorDetails: {
                code: profileError.code,
                message: profileError.message,
                details: profileError.details,
                hint: profileError.hint
            }
        });
        throw new Error(`Profile not found for Clerk user ID: ${userId}`);
    }

    if (!profile) {
        console.error('No profile found for user:', {
            clerkUserId: userId,
            query: 'profiles.select(id).eq(clerk_user_id, userId).single()'
        });
        throw new Error(`Profile not found for Clerk user ID: ${userId}`);
    }

    console.log('Successfully retrieved profile ID:', {
        profileId: profile.id,
        clerkUserId: userId
    });
    return profile.id;
}

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
        };

        console.log('Raw form data:', {
            nameLength: rawData.name?.toString().length,
            descriptionLength: rawData.description?.toString().length,
            clientGreetingLength: rawData.client_greeting?.toString().length
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
                    hasClientGreeting: !!validatedData.client_greeting
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
