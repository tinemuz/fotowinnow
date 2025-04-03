'use server';

import { auth } from '@clerk/nextjs/server';
import { createSupabaseServerActionClient } from '../supabase/server';
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

    if (!userId) {
        throw new Error('User not authenticated');
    }

    const supabase = await createSupabaseServerActionClient();

    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('clerk_user_id', userId)
        .single();

    if (profileError || !profile) {
        throw new Error('Profile not found');
    }

    return profile.id;
}

export async function getAlbums(): Promise<Album[]> {
    const profileId = await getAuthenticatedProfileId();

    const supabase = await createSupabaseServerActionClient();

    // Get the albums
    const { data: albums, error: albumsError } = await supabase
        .from('albums')
        .select('*')
        .eq('owner_id', profileId)
        .order('created_at', { ascending: false });

    if (albumsError) {
        throw new Error('Failed to fetch albums');
    }

    return albums || [];
}

export async function createAlbum(formData: FormData) {
    const profileId = await getAuthenticatedProfileId();

    const supabase = await createSupabaseServerActionClient();

    // Parse and validate the form data
    const rawData = {
        name: formData.get('name'),
        description: formData.get('description'),
        client_greeting: formData.get('client_greeting'),
    };

    const validatedData = createAlbumSchema.parse(rawData);

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
        throw new Error('Failed to create album');
    }

    // Revalidate the albums page
    revalidatePath('/dashboard/albums');

    return album;
}
