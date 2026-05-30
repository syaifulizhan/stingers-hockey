import { NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase/server";
import { getMyRole, isAdmin } from "@/lib/portal-auth";

// Lantik/turunkan peranan ahli. HANYA admin (lapisan pertama di sini;
// trigger DB protect_user_role ialah lapisan kedua yang menguatkuasakan).
const schema = z.object({
  targetClerkId: z.string().min(1),
  role: z.enum(["member", "coach"]),
});

export async function POST(request: Request) {
  const role = await getMyRole();
  if (!isAdmin(role)) {
    return NextResponse.json(
      { ok: false, error: "Hanya admin boleh tukar peranan." },
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

  const supabase = await createServerSupabase();
  const { error } = await supabase
    .from("users")
    .update({ role: parsed.data.role })
    .eq("clerk_user_id", parsed.data.targetClerkId);

  if (error) {
    console.error("[coach/role] gagal:", error.message);
    return NextResponse.json({ ok: false, error: "Gagal tukar peranan." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
