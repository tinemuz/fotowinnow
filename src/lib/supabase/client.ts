// src/lib/supabase/client.ts
import {createBrowserClient} from '@supabase/ssr';

// Define a function to create the client instance (allows for potential flexibility later)
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
        supabaseAnonKey
    );
}

// Export a singleton instance for easy use in client components
export const supabase = createClient();

// Type helper for Supabase client type (optional, but good practice)
// You might generate more specific types later using `supabase gen types typescript`
export type SupabaseClient = typeof supabase;