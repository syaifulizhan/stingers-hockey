import { createClient } from "@supabase/supabase-js";

/**
 * Klien Supabase pentadbir (service role) — SERVER SAHAJA.
 *
 * Ia MEMINTAS RLS. Kawalan akses ditentukan di lapisan app (Clerk + allowlist),
 * jadi setiap pemanggil WAJIB sudah sahkan siapa pengguna dahulu.
 * JANGAN sekali-kali import fail ini dari komponen klien.
 */
export function createSupabaseAdmin() {
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  if (!key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY tiada. Gate allowlist tidak boleh berjalan tanpa ia."
    );
  }
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
