import { NextResponse } from "next/server";
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
