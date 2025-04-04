// src/lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr';

// Add type declaration for Clerk
declare global {
    interface Window {
        Clerk?: {
            session?: {
                getToken: (options: { template: string }) => Promise<string | null>;
            };
            user?: {
                id: string;
            };
        };
    }
}

// Define a function to create the client instance
function createClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error(
            "Supabase URL or Anon Key is missing from environment variables. Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in .env.local"
        );
    }

    return createBrowserClient(
        supabaseUrl,
        supabaseAnonKey,
        {
            auth: {
                persistSession: false,
                autoRefreshToken: false,
                detectSessionInUrl: false
            },
            global: {
                headers: {
                    // The new approach uses a simpler header structure
                    'x-clerk-user-id': window.Clerk?.user?.id || '',
                }
            }
        }
    );
}

// Export a singleton instance for easy use in client components
export const supabase = createClient();

// Type helper for Supabase client type
export type SupabaseClient = typeof supabase;