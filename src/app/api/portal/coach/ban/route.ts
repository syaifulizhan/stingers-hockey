import { NextResponse } from "next/server";
import { z } from "zod";
import { clerkClient } from "@clerk/nextjs/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { getMyRole, isAdmin } from "@/lib/portal-auth";

// Ban / authorize semula seorang ahli. HANYA admin.
//  - Ban: halang login (Clerk), tanda banned, BUANG hantaran + media (jimat storan).
//  - Authorize: benarkan login semula, banned = false.
const schema = z.object({
  targetClerkId: z.string().min(1),
  banned: z.boolean(),
});

export async function POST(request: Request) {
  const role = await getMyRole();
  if (!isAdmin(role)) {
    return NextResponse.json(
      { ok: false, error: "Hanya admin boleh ban/authorize." },
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
  const { targetClerkId, banned } = parsed.data;

  const supabase = await createServerSupabase();

  // 1. Tanda status banned dalam Supabase.
  const { error } = await supabase
    .from("users")
    .update({ banned })
    .eq("clerk_user_id", targetClerkId);
  if (error) {
    console.error("[coach/ban] supabase gagal:", error.message);
    return NextResponse.json({ ok: false, error: "Gagal kemas kini." }, { status: 500 });
  }

  // 2. Bila ban: buang hantaran + fail bukti (jimat storan Supabase).
  if (banned) {
    try {
      const { data: subs } = await supabase
        .from("submissions")
        .select("media_url")
        .eq("user_id", targetClerkId);
      const paths = (subs ?? [])
        .map((s: { media_url: string | null }) => s.media_url)
        .filter((u): u is string => !!u)
        .map((u) => u.split("/task-proof/")[1])
        .filter((p): p is string => !!p);
      if (paths.length) await supabase.storage.from("task-proof").remove(paths);
      await supabase.from("submissions").delete().eq("user_id", targetClerkId);
    } catch (err) {
      console.error("[coach/ban] cleanup media gagal:", err);
    }
  }

  // 3. Clerk: ban/unban (halang/benarkan login).
  try {
    const client = await clerkClient();
    if (banned) await client.users.banUser(targetClerkId);
    else await client.users.unbanUser(targetClerkId);
  } catch (err) {
    console.error("[coach/ban] clerk gagal:", err);
    return NextResponse.json(
      { ok: false, error: "Status disimpan, tapi gagal kemas kini akaun Clerk." },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true });
}
