import { auth, currentUser } from "@clerk/nextjs/server";
import { createServerSupabase } from "@/lib/supabase/server";

export type Role = "member" | "coach" | "admin";

// Pastikan ahli WUJUD dalam Supabase sebaik mereka masuk portal — walaupun
// belum lengkapkan profil. Ini buat mereka:
//   • nampak terus di Panel Jurulatih (boleh diberi task / direkod kehadiran),
//   • ada peranan 'member' (bukan null), jadi portal berfungsi penuh.
// ignoreDuplicates: kalau baris dah ada, ia TIDAK menimpa data profil sedia ada.
export async function ensureUserRow() {
  const { userId } = await auth();
  if (!userId) return;
  const user = await currentUser();
  const fullName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    user?.username ||
    null;
  const email = user?.primaryEmailAddress?.emailAddress ?? null;
  const supabase = await createServerSupabase();
  const { error } = await supabase.from("users").upsert(
    { clerk_user_id: userId, full_name: fullName, email, profile_complete: false },
    { onConflict: "clerk_user_id", ignoreDuplicates: true }
  );
  if (error) console.error("[ensureUserRow] gagal:", error.message);
}

// Dapatkan peranan pengguna semasa dari Supabase (sumber kebenaran sebenar).
export async function getMyRole(): Promise<Role | null> {
  const { userId } = await auth();
  if (!userId) return null;
  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from("users")
    .select("role")
    .eq("clerk_user_id", userId)
    .maybeSingle();
  return ((data?.role as Role) ?? null) || null;
}

export function isCoach(role: Role | null) {
  return role === "coach" || role === "admin";
}

export function isAdmin(role: Role | null) {
  return role === "admin";
}
