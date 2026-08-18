import { auth } from "@clerk/nextjs/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { getPortalAccess } from "@/lib/portal-guard";

export type Role = "member" | "coach" | "admin";

/**
 * @deprecated Guna getPortalAccess() / requireApprovedPage() dari
 * `@/lib/portal-guard`. Dikekalkan sebagai pembungkus nipis supaya kod lama
 * tidak pecah — gate itulah yang kini mencipta baris users DAN rekod
 * pending_approvals seiring.
 */
export async function ensureUserRow() {
  await getPortalAccess();
}

// Dapatkan peranan pengguna semasa dari Supabase (sumber kebenaran sebenar).
export async function getMyRole(): Promise<Role | null> {
  const { userId } = await auth();
  if (!userId) return null;
  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from("users")
    .select("role, approval_status")
    .eq("clerk_user_id", userId)
    .maybeSingle();
  // Akaun yang belum diluluskan TIADA peranan — seorang 'coach' yang masih
  // menunggu kelulusan tidak boleh menggunakan kuasa coach.
  if (data?.approval_status !== "approved") return null;
  return ((data?.role as Role) ?? null) || null;
}

export function isCoach(role: Role | null) {
  return role === "coach" || role === "admin";
}

export function isAdmin(role: Role | null) {
  return role === "admin";
}
