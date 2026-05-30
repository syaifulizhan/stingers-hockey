import { createClient } from "@supabase/supabase-js";
import { auth } from "@clerk/nextjs/server";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Klien Supabase untuk kod SERVER (server components, route handlers, server actions).
// Ia menyertakan token Clerk pengguna semasa supaya RLS Supabase tahu siapa
// mereka — jadi peraturan "ahli nampak data sendiri, coach nampak semua" terpakai.
export async function createServerSupabase() {
  const { getToken } = await auth();
  return createClient(url, anonKey, {
    accessToken: async () => (await getToken()) ?? null,
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
