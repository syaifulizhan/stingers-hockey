import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { auth } from "@clerk/nextjs/server";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// GET /api/portal/admin/pending-approvals — Dapatkan senarai pending approval
export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Tidak login" }, { status: 401 });
  }

  // Semak admin/coach
  const { data: user } = await getSupabase()
    .from("users")
    .select("role")
    .eq("clerk_user_id", userId)
    .single();

  if (!user || !["admin", "coach"].includes(user.role)) {
    return NextResponse.json(
      { error: "Hanya admin/coach boleh lihat pending approval" },
      { status: 403 }
    );
  }

  const { data, error } = await getSupabase()
    .from("pending_approvals")
    .select(
      `
      *,
      user:users(clerk_user_id, full_name, email, school, profile_complete, created_at)
    `
    )
    .eq("status", "pending")
    .order("requested_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ pending: data });
}

// POST /api/portal/admin/pending-approvals/:id/approve — Luluskan pendaftaran
export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Tidak login" }, { status: 401 });
  }

  // Semak admin/coach
  const { data: user } = await getSupabase()
    .from("users")
    .select("role")
    .eq("clerk_user_id", userId)
    .single();

  if (!user || !["admin", "coach"].includes(user.role)) {
    return NextResponse.json(
      { error: "Hanya admin/coach boleh approve" },
      { status: 403 }
    );
  }

  const body = await request.json();
  const { approvalId, action, note } = body; // action: 'approve' | 'reject'

  if (!approvalId || !["approve", "reject"].includes(action)) {
    return NextResponse.json(
      { error: "approvalId & action diperlukan" },
      { status: 400 }
    );
  }

  // Ambil pending approval record
  const { data: pending, error: fetchErr } = await getSupabase()
    .from("pending_approvals")
    .select("*")
    .eq("id", approvalId)
    .single();

  if (fetchErr || !pending) {
    return NextResponse.json({ error: "Tidak jumpa approval" }, { status: 404 });
  }

  // Update pending_approvals
  const newStatus = action === "approve" ? "approved" : "rejected";
  const { error: updateErr } = await getSupabase()
    .from("pending_approvals")
    .update({
      status: newStatus,
      reviewed_by: userId,
      reviewed_at: new Date().toISOString(),
      note: note || null,
    })
    .eq("id", approvalId);

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  // Update user approval_status
  const { error: userErr } = await getSupabase()
    .from("users")
    .update({ approval_status: newStatus })
    .eq("clerk_user_id", pending.user_id);

  if (userErr) {
    return NextResponse.json({ error: userErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, status: newStatus });
}
