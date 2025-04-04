// src/lib/supabase/client.ts
import { createClient } from '@supabase/supabase-js'

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

// Create a singleton instance
let supabaseInstance: ReturnType<typeof createClient> | null = null;

// Define a function to create the client instance
export const createSupabaseClient = () => {
    if (supabaseInstance) {
        return supabaseInstance;
    }

    supabaseInstance = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    return supabaseInstance;
}

// Export a singleton instance for easy use in client components
export const supabase = createSupabaseClient();

// Type helper for Supabase client type
export type SupabaseClient = typeof supabase;