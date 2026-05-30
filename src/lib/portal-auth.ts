import { auth } from "@clerk/nextjs/server";
import { createServerSupabase } from "@/lib/supabase/server";

export type Role = "member" | "coach" | "admin";

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
