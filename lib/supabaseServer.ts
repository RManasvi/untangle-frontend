import { createClient } from '@supabase/supabase-js';

/**
 * Creates a Supabase client with the service-role key.
 * Use this ONLY in server-side code (API routes, lib functions).
 * It bypasses Row-Level Security — never expose this to the browser.
 */
export function createServerClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
        throw new Error(
            '[supabaseServer] Missing env vars: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY'
        );
    }

    return createClient(url, key, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
        },
    });
}
