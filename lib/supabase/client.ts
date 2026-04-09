import { createClient } from '@supabase/supabase-js';

// Client-side Supabase client for database queries only
// Auth handled by Firebase
export function createSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
