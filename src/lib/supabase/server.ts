// src/lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { type ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies';
import { auth } from '@clerk/nextjs/server';

// Cache for profile IDs to reduce database queries
const profileIdCache = new Map<string, string>();

// Function to get the authenticated profile ID with caching
export async function getAuthenticatedProfileId(): Promise<string> {
    const { userId } = await auth();

    if (!userId) {
        throw new Error('User not authenticated');
    }

    // Check if profile ID is in cache
    if (profileIdCache.has(userId)) {
        return profileIdCache.get(userId)!;
    }

    // If not in cache, query the database
    const supabase = createSupabaseAdminClient();

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

    // Store in cache for future use
    profileIdCache.set(userId, profile.id);

    return profile.id;
}

// Function to create Supabase client for Server Components, Server Actions, Route Handlers
// It reads/writes cookies to manage the user's session server-side.
export async function createSupabaseServerClient(cookieStore: ReadonlyRequestCookies) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
        console.error('Missing Supabase credentials:', {
            hasUrl: !!supabaseUrl,
            hasAnonKey: !!supabaseAnonKey
        });
        throw new Error(
            "Supabase URL or Anon Key is missing from environment variables. Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set."
        );
    }

    // Get the Clerk user ID
    const { userId } = await auth();

    const client = createServerClient(
        supabaseUrl,
        supabaseAnonKey,
        {
            cookies: {
                async getAll() {
                    const allCookies = await cookieStore.getAll();
                    return allCookies.map(cookie => ({
                        name: cookie.name,
                        value: cookie.value
                    }));
                },
                async setAll(cookies: { name: string; value: string }[]) {
                    try {
                        for (const cookie of cookies) {
                            await cookieStore.set({
                                name: cookie.name,
                                value: cookie.value,
                                sameSite: 'lax',
                                path: '/',
                                secure: process.env.NODE_ENV === 'production'
                            });
                        }
                    } catch (error) {
                        console.error('Error setting cookies for Supabase client:', {
                            error,
                            errorMessage: error instanceof Error ? error.message : 'Unknown error',
                            stack: error instanceof Error ? error.stack : undefined
                        });
                        // The `setAll` method was called from a Server Component.
                        // This can be ignored if you have middleware refreshing
                        // user sessions.
                    }
                }
            },
            cookieOptions: {
                name: 'sb-auth-token',
                sameSite: 'lax',
                path: '/',
                secure: process.env.NODE_ENV === 'production'
            },
            global: {
                headers: {
                    // The new approach uses a simpler header structure
                    'x-clerk-user-id': userId || '',
                }
            }
        }
    );

    return client;
}

// Function to create Supabase client specifically for Server Actions or Route Handlers
// where you might need to write cookies back.
// Often, createSupabaseServerClient can be used for these too, but this provides a clear separation.
export async function createSupabaseServerActionClient() {
    try {
        const cookieStore = await cookies();
        const client = await createSupabaseServerClient(cookieStore as unknown as ReadonlyRequestCookies);
        return client;
    } catch (error) {
        console.error('Error creating Supabase server action client:', {
            error,
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined
        });
        throw error;
    }
}

// Function to create a Supabase Admin client using the SERVICE_ROLE_KEY
// WARNING: Use this client ONLY in secure server-side environments (like API routes, server actions protected from client invocation).
// It bypasses RLS policies. Primarily needed for tasks like the Clerk webhook sync.
export function createSupabaseAdminClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
        console.error('Missing Supabase admin credentials:', {
            hasUrl: !!supabaseUrl,
            hasServiceKey: !!supabaseServiceKey
        });
        throw new Error(
            "Supabase URL or Service Role Key is missing from environment variables. Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set."
        );
    }

    const client = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });

    return client;
}