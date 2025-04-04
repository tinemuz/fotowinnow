// src/lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { type ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies';
import { auth } from '@clerk/nextjs/server';

// Function to create Supabase client for Server Components, Server Actions, Route Handlers
// It reads/writes cookies to manage the user's session server-side.
export async function createSupabaseServerClient(cookieStore: ReadonlyRequestCookies) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error(
            "Supabase URL or Anon Key is missing from environment variables. Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set."
        );
    }

    // Get the Clerk user ID
    const { userId } = await auth();

    return createServerClient(
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
                    } catch {
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
}

// Function to create Supabase client specifically for Server Actions or Route Handlers
// where you might need to write cookies back.
// Often, createSupabaseServerClient can be used for these too, but this provides a clear separation.
export async function createSupabaseServerActionClient() {
    const cookieStore = cookies();
    return createSupabaseServerClient(cookieStore as unknown as ReadonlyRequestCookies);
}

// Function to create a Supabase Admin client using the SERVICE_ROLE_KEY
// WARNING: Use this client ONLY in secure server-side environments (like API routes, server actions protected from client invocation).
// It bypasses RLS policies. Primarily needed for tasks like the Clerk webhook sync.
export function createSupabaseAdminClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error(
            "Supabase URL or Service Role Key is missing from environment variables. Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set."
        );
    }

    return createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });
}