import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Klien Supabase AWAM — tanpa token Clerk (peranan 'anon').
// Untuk laman public sahaja. RLS hanya benarkan baca jadual 'news'.
export function createPublicSupabase() {
  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
