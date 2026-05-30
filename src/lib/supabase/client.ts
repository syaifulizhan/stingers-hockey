"use client";

import { createClient } from "@supabase/supabase-js";
import { useSession } from "@clerk/nextjs";
import { useMemo } from "react";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Klien Supabase untuk komponen PELAYAR ("use client").
// Token Clerk disertakan setiap permintaan supaya RLS kenal pengguna.
export function useSupabase() {
  const { session } = useSession();
  return useMemo(
    () =>
      createClient(url, anonKey, {
        accessToken: async () => (await session?.getToken()) ?? null,
        auth: { persistSession: false, autoRefreshToken: false },
      }),
    [session]
  );
}
