import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { requireCoachApi } from "@/lib/portal-guard";

// GET /api/portal/admin/pending-approvals — senarai pendaftaran menunggu kelulusan
export async function GET() {
  const gate = await requireCoachApi();
  if (!gate.ok) return gate.response;

  const { data, error } = await createSupabaseAdmin()
    .from("pending_approvals")
    .select(
      `*, user:users(clerk_user_id, full_name, email, school, profile_complete, created_at)`
    )
    .eq("status", "pending")
    .order("requested_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ pending: data ?? [] });
}

// POST — luluskan atau tolak satu pendaftaran
export async function POST(request: Request) {
  const gate = await requireCoachApi();
  if (!gate.ok) return gate.response;

  const body = await request.json().catch(() => null);
  const { approvalId, action, note } = (body ?? {}) as {
    approvalId?: string;
    action?: string;
    note?: string;
  };

  if (!approvalId || !action || !["approve", "reject"].includes(action)) {
    return NextResponse.json(
      { error: "approvalId & action diperlukan" },
      { status: 400 }
    );
  }

  const sb = createSupabaseAdmin();
  const { data: pending, error: fetchErr } = await sb
    .from("pending_approvals")
    .select("user_id")
    .eq("id", approvalId)
    .maybeSingle();

  if (fetchErr || !pending) {
    return NextResponse.json({ error: "Tidak jumpa approval" }, { status: 404 });
  }

  const newStatus = action === "approve" ? "approved" : "rejected";

  const { error: updateErr } = await sb
    .from("pending_approvals")
    .update({
      status: newStatus,
      reviewed_by: gate.access.userId,
      reviewed_at: new Date().toISOString(),
      note: note || null,
    })
    .eq("id", approvalId);

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  const { error: userErr } = await sb
    .from("users")
    .update({ approval_status: newStatus })
    .eq("clerk_user_id", pending.user_id);

  if (userErr) {
    return NextResponse.json({ error: userErr.message }, { status: 500 });
  }

  // Menolak seseorang mesti turut mengeluarkan emel mereka dari allowlist —
  // jika tidak, gate akan meluluskannya semula pada log masuk berikutnya.
  if (newStatus === "rejected") {
    const { data: u } = await sb
      .from("users")
      .select("email")
      .eq("clerk_user_id", pending.user_id)
      .maybeSingle();
    if (u?.email) {
      await sb
        .from("allowlist_emails")
        .delete()
        .eq("email", u.email.toLowerCase());
    }
  }

  return NextResponse.json({ ok: true, status: newStatus });
}
