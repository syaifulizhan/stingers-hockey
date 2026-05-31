import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase/server";
import { getMyRole, isAdmin } from "@/lib/portal-auth";

// Admin kemas kini nama sebenar pemain (display_name) & penanda penjaga gol.
const schema = z.object({
  targetClerkId: z.string().min(1),
  displayName: z.string().max(100).optional(),
  isGoalkeeper: z.boolean().optional(),
});

export async function PATCH(request: Request) {
  if (!isAdmin(await getMyRole())) {
    return NextResponse.json(
      { ok: false, error: "Hanya admin boleh edit." },
      { status: 403 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Permintaan tidak sah." }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Data tidak sah." }, { status: 422 });
  }
  const { targetClerkId, displayName, isGoalkeeper } = parsed.data;

  const update: Record<string, unknown> = {};
  if (displayName !== undefined) update.display_name = displayName.trim() || null;
  if (isGoalkeeper !== undefined) update.is_goalkeeper = isGoalkeeper;
  if (Object.keys(update).length === 0) {
    return NextResponse.json({ ok: false, error: "Tiada perubahan." }, { status: 422 });
  }

  const supabase = await createServerSupabase();
  const { error } = await supabase
    .from("users")
    .update(update)
    .eq("clerk_user_id", targetClerkId);

  if (error) {
    console.error("[coach/member] gagal:", error.message);
    return NextResponse.json({ ok: false, error: "Gagal kemas kini." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

// Padam ahli SECARA KEKAL — akaun Clerk + semua data Supabase. Admin sahaja.
export async function DELETE(request: Request) {
  const { userId } = await auth();
  if (!isAdmin(await getMyRole())) {
    return NextResponse.json({ ok: false, error: "Hanya admin boleh padam." }, { status: 403 });
  }
  const id = new URL(request.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ ok: false, error: "id diperlukan." }, { status: 400 });
  }
  if (id === userId) {
    return NextResponse.json({ ok: false, error: "Tidak boleh padam diri sendiri." }, { status: 400 });
  }

  // 1. Padam akaun Clerk (supaya tak boleh log masuk / cipta semula baris).
  try {
    const client = await clerkClient();
    await client.users.deleteUser(id);
  } catch (e) {
    // Abaikan jika akaun sudah tiada; gagal lain dilog tetapi teruskan.
    console.error("[coach/member] padam Clerk:", e instanceof Error ? e.message : e);
  }

  // 2. Padam data berkaitan + baris pengguna di Supabase.
  const supabase = await createServerSupabase();
  await supabase.from("attendance").delete().eq("user_id", id);
  await supabase.from("submissions").delete().eq("user_id", id);
  await supabase.from("assessments").delete().eq("user_id", id);
  const { error } = await supabase.from("users").delete().eq("clerk_user_id", id);

  if (error) {
    console.error("[coach/member] padam gagal:", error.message);
    return NextResponse.json({ ok: false, error: "Gagal padam ahli." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
