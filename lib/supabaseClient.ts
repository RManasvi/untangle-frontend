import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase Environment Variables Missing! Please check .env.local');
}

export const createClient = () =>
    createBrowserClient(
        supabaseUrl!,
        supabaseKey!
    );
