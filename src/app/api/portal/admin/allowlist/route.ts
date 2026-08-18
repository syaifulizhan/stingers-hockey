import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { requireCoachApi } from "@/lib/portal-guard";

// ============================================================================
// ALLOWLIST EMAIL — pra-kelulusan (corak yang sama seperti gpi.edu.my).
// Emel di sini diluluskan AUTOMATIK sebaik pemiliknya log masuk kali pertama,
// jadi admin tak perlu menunggu untuk menekan "Luluskan" seorang demi seorang.
// ============================================================================

function normalise(email: unknown): string | null {
  if (typeof email !== "string") return null;
  const e = email.trim().toLowerCase();
  // Semakan bentuk emel yang mudah tetapi memadai.
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e)) return null;
  return e;
}

// GET — senarai emel dalam allowlist
export async function GET() {
  const gate = await requireCoachApi();
  if (!gate.ok) return gate.response;

  const { data, error } = await createSupabaseAdmin()
    .from("allowlist_emails")
    .select("email, note, added_by, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, emails: data ?? [] });
}

// POST — tambah satu atau beberapa emel (dipisah koma / baris baharu)
export async function POST(request: Request) {
  const gate = await requireCoachApi();
  if (!gate.ok) return gate.response;

  const body = await request.json().catch(() => null);
  const raw = (body as { email?: string; note?: string } | null)?.email ?? "";
  const note = (body as { note?: string } | null)?.note?.slice(0, 200) || null;

  const emails = String(raw)
    .split(/[,\n;]/)
    .map(normalise)
    .filter((e): e is string => !!e);

  if (emails.length === 0) {
    return NextResponse.json(
      { ok: false, error: "Emel tidak sah." },
      { status: 422 }
    );
  }

  const sb = createSupabaseAdmin();
  const { error } = await sb.from("allowlist_emails").upsert(
    emails.map((email) => ({
      email,
      note,
      added_by: gate.access.userId,
    })),
    { onConflict: "email" }
  );

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  // Luluskan terus sesiapa yang SUDAH mendaftar dengan emel ini — tanpa ini
  // mereka tersekat di skrin "menunggu kelulusan" sehingga log masuk semula.
  const { data: matched } = await sb
    .from("users")
    .select("clerk_user_id")
    .in("email", emails);

  const ids = (matched ?? []).map((u) => u.clerk_user_id as string);
  if (ids.length > 0) {
    await sb
      .from("users")
      .update({ approval_status: "approved" })
      .in("clerk_user_id", ids);
    await sb
      .from("pending_approvals")
      .update({
        status: "approved",
        reviewed_by: gate.access.userId,
        reviewed_at: new Date().toISOString(),
        note: "Diluluskan melalui allowlist emel",
      })
      .in("user_id", ids);
  }

  return NextResponse.json({ ok: true, added: emails.length, approved: ids.length });
}

// DELETE — buang emel dari allowlist
export async function DELETE(request: Request) {
  const gate = await requireCoachApi();
  if (!gate.ok) return gate.response;

  const body = await request.json().catch(() => null);
  const email = normalise((body as { email?: string } | null)?.email);
  if (!email) {
    return NextResponse.json({ ok: false, error: "Emel tidak sah." }, { status: 422 });
  }

  const { error } = await createSupabaseAdmin()
    .from("allowlist_emails")
    .delete()
    .eq("email", email);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  // Nota: membuang dari allowlist TIDAK menarik balik kelulusan sedia ada.
  // Untuk itu gunakan "Tolak" pada pengguna berkenaan — supaya tindakan
  // menarik akses sentiasa satu keputusan yang jelas, bukan kesan sampingan.
  return NextResponse.json({ ok: true });
}
