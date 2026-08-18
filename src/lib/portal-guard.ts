import { cache } from "react";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

// ============================================================================
// GATE ALLOWLIST — SATU-SATUNYA sumber kebenaran untuk akses portal.
//
// Corak ini disalin dari gpi.edu.my (`requireAllowedUser`): penguatkuasaan
// berlaku di SERVER, sebelum sebarang data disentuh. Guard di klien hanyalah
// hiasan UX — ia tidak menghalang sesiapa.
//
// Peraturan emas: GAGAL = TOLAK. Kalau DB tak dapat dihubungi, kalau lajur
// hilang, kalau apa-apa melencong — pengguna TIDAK diluluskan. Satu-satunya
// jalan keluar kecemasan ialah env PORTAL_ALLOWED_EMAILS.
// ============================================================================

export type Role = "member" | "coach" | "admin";
export type ApprovalStatus = "pending" | "approved" | "rejected";

export type PortalAccess = {
  userId: string;
  email: string | null;
  role: Role;
  status: ApprovalStatus;
  approved: boolean;
};

/** Email bootstrap dari env (dipisah koma) — jaring keselamatan jika DB tumbang. */
function envAllowedEmails(): string[] {
  return (process.env.PORTAL_ALLOWED_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/** Email yang sentiasa admin, walaupun DB kata lain (bootstrap). */
function envAdminEmails(): string[] {
  return (process.env.PORTAL_ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Tentukan akses portal pengguna semasa.
 * Dicache per-request supaya berbilang panggilan dalam satu render hanya
 * memukul DB sekali.
 */
export const getPortalAccess = cache(async (): Promise<PortalAccess | null> => {
  const { userId } = await auth();
  if (!userId) return null;

  const clerkUser = await currentUser();
  const email =
    clerkUser?.primaryEmailAddress?.emailAddress?.toLowerCase() ?? null;

  // Jaring bootstrap: dinilai SEBELUM DB supaya admin tak terkunci di luar
  // sekiranya Supabase tumbang atau migrasi belum dijalankan.
  const envAllowed = !!email && envAllowedEmails().includes(email);
  const envAdmin = !!email && envAdminEmails().includes(email);

  let sb: ReturnType<typeof createSupabaseAdmin>;
  try {
    sb = createSupabaseAdmin();
  } catch (err) {
    console.error("[portal-guard] klien admin gagal:", err);
    return {
      userId,
      email,
      role: envAdmin ? "admin" : "member",
      status: envAllowed || envAdmin ? "approved" : "pending",
      approved: envAllowed || envAdmin,
    };
  }

  // Pastikan baris users wujud. approval_status dibiarkan pada default DB
  // ('pending') — TIDAK ditulis 'approved' di sini.
  await ensurePortalUserRow(sb, userId, clerkUser, email);

  const { data: row, error } = await sb
    .from("users")
    .select("role, approval_status, email")
    .eq("clerk_user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("[portal-guard] baca users gagal:", error.message);
    // Gagal = tolak. Hanya env boleh selamatkan.
    return {
      userId,
      email,
      role: envAdmin ? "admin" : "member",
      status: envAllowed || envAdmin ? "approved" : "pending",
      approved: envAllowed || envAdmin,
    };
  }

  const role: Role = envAdmin ? "admin" : ((row?.role as Role) ?? "member");
  const status: ApprovalStatus =
    (row?.approval_status as ApprovalStatus) ?? "pending";

  // Ditolak secara eksplisit mengatasi allowlist email — admin sengaja tolak.
  if (status === "rejected" && !envAllowed && !envAdmin) {
    return { userId, email, role, status, approved: false };
  }

  // Bootstrap kalis-kunci: email dalam PORTAL_ADMIN_EMAILS disegerakkan ke DB
  // (role=admin, approved). Perlu kerana RLS bergantung pada DB, bukan env —
  // tanpa ini seorang admin yang tersekat 'pending' akan dinafikan oleh RLS
  // walaupun app membenarkannya.
  if (envAdmin && (row?.role !== "admin" || status !== "approved")) {
    await sb
      .from("users")
      .update({ role: "admin", approval_status: "approved" })
      .eq("clerk_user_id", userId);
    await approveUser(sb, userId, "env-admin-bootstrap");
    return { userId, email, role: "admin", status: "approved", approved: true };
  }

  if (envAllowed && status !== "approved") {
    await approveUser(sb, userId, "env-allowlist");
    return { userId, email, role, status: "approved", approved: true };
  }

  if (status === "approved") {
    return { userId, email, role, status: "approved", approved: true };
  }

  // Belum diluluskan — semak allowlist email yang diurus dalam app.
  // Kalis-ralat: jika jadual belum wujud, layan sebagai TIADA dalam allowlist.
  if (email) {
    const { data: allowed } = await sb
      .from("allowlist_emails")
      .select("email")
      .eq("email", email)
      .maybeSingle();

    if (allowed) {
      // Pra-lulus: selaraskan DB supaya RLS & panel admin sepadan.
      await approveUser(sb, userId, "allowlist-email");
      return { userId, email, role, status: "approved", approved: true };
    }
  }

  return { userId, email, role, status, approved: false };
});

type ClerkUser = Awaited<ReturnType<typeof currentUser>>;

/**
 * Cipta baris users jika belum ada, DAN rekod pending_approvals seiring —
 * supaya tiada pengguna yang tersembunyi dari panel kelulusan admin.
 */
async function ensurePortalUserRow(
  sb: ReturnType<typeof createSupabaseAdmin>,
  userId: string,
  clerkUser: ClerkUser,
  email: string | null
) {
  const fullName =
    clerkUser?.username || clerkUser?.firstName || clerkUser?.lastName || null;

  const { data: existing } = await sb
    .from("users")
    .select("clerk_user_id, profile_complete, full_name")
    .eq("clerk_user_id", userId)
    .maybeSingle();

  if (existing) {
    if (!existing.profile_complete && fullName && existing.full_name !== fullName) {
      await sb
        .from("users")
        .update({ full_name: fullName, email })
        .eq("clerk_user_id", userId);
    }
    // Baris sedia ada: tiada tulisan lain di sini. Rekod pending_approvals
    // untuk pengguna lama ditampung sekali sahaja oleh migrasi
    // 20260819_allowlist_enforcement.sql, bukan pada setiap permintaan.
    return;
  }

  const { error } = await sb.from("users").insert({
    clerk_user_id: userId,
    full_name: fullName,
    email,
    profile_complete: false,
    // approval_status dibiar pada default DB: 'pending'.
  });
  if (error) {
    console.error("[portal-guard] insert users gagal:", error.message);
    return;
  }

  // Sign up BAHARU → rekod pending_approvals serentak, supaya tiada pengguna
  // yang wujud dalam DB tetapi tidak kelihatan di panel kelulusan admin.
  const { error: pendingErr } = await sb
    .from("pending_approvals")
    .upsert(
      { user_id: userId, status: "pending", requested_at: new Date().toISOString() },
      { onConflict: "user_id", ignoreDuplicates: true }
    );
  if (pendingErr && pendingErr.code !== "23505") {
    console.error("[portal-guard] upsert pending_approvals gagal:", pendingErr.message);
  }
}

/** Tandakan pengguna sebagai diluluskan dalam kedua-dua jadual. */
async function approveUser(
  sb: ReturnType<typeof createSupabaseAdmin>,
  userId: string,
  reviewedBy: string
) {
  await sb
    .from("users")
    .update({ approval_status: "approved" })
    .eq("clerk_user_id", userId);
  await sb
    .from("pending_approvals")
    .update({
      status: "approved",
      reviewed_by: reviewedBy,
      reviewed_at: new Date().toISOString(),
    })
    .eq("user_id", userId);
}

// ── Gate untuk PAGE (server component) ──────────────────────────────────────

/** Wajibkan pengguna log masuk DAN diluluskan. Jika tidak → redirect. */
export async function requireApprovedPage(): Promise<PortalAccess> {
  const access = await getPortalAccess();
  if (!access) redirect("/portal/sign-in");
  if (!access.approved) redirect("/portal/approval-pending");
  return access;
}

/** Wajibkan jurulatih atau admin. */
export async function requireCoachPage(): Promise<PortalAccess> {
  const access = await requireApprovedPage();
  if (access.role !== "coach" && access.role !== "admin") {
    redirect("/portal/dashboard");
  }
  return access;
}

/** Wajibkan admin penuh. */
export async function requireAdminPage(): Promise<PortalAccess> {
  const access = await requireApprovedPage();
  if (access.role !== "admin" && access.role !== "coach") {
    redirect("/portal/dashboard");
  }
  return access;
}

// ── Gate untuk API ROUTE ────────────────────────────────────────────────────

export type ApiGate =
  | { ok: true; access: PortalAccess }
  | { ok: false; response: NextResponse };

/**
 * Gate untuk route handler. Guna:
 *   const gate = await requireApprovedApi();
 *   if (!gate.ok) return gate.response;
 */
export async function requireApprovedApi(): Promise<ApiGate> {
  const access = await getPortalAccess();
  if (!access) {
    return {
      ok: false,
      response: NextResponse.json(
        { ok: false, error: "Sila log masuk." },
        { status: 401 }
      ),
    };
  }
  if (!access.approved) {
    return {
      ok: false,
      response: NextResponse.json(
        { ok: false, error: "Akaun anda belum diluluskan oleh admin." },
        { status: 403 }
      ),
    };
  }
  return { ok: true, access };
}

/** Gate API yang turut menuntut peranan jurulatih/admin. */
export async function requireCoachApi(): Promise<ApiGate> {
  const gate = await requireApprovedApi();
  if (!gate.ok) return gate;
  if (gate.access.role !== "coach" && gate.access.role !== "admin") {
    return {
      ok: false,
      response: NextResponse.json(
        { ok: false, error: "Hanya jurulatih/admin." },
        { status: 403 }
      ),
    };
  }
  return gate;
}

/** Gate API yang menuntut admin penuh. */
export async function requireAdminApi(): Promise<ApiGate> {
  const gate = await requireApprovedApi();
  if (!gate.ok) return gate;
  if (gate.access.role !== "admin") {
    return {
      ok: false,
      response: NextResponse.json(
        { ok: false, error: "Hanya admin." },
        { status: 403 }
      ),
    };
  }
  return gate;
}
