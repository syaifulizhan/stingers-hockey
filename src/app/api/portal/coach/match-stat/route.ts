import { NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase/server";
import { getMyRole, isCoach } from "@/lib/portal-auth";
import { ALL_MATCH_KEYS } from "@/lib/match";

// Jurulatih/admin rekod prestasi seorang pemain untuk satu perlawanan.
const schema = z.object({
  matchId: z.string().uuid(),
  targetUserId: z.string().min(1),
  stats: z.record(z.string(), z.number().int().min(0).max(999)),
});

export async function POST(request: Request) {
  if (!isCoach(await getMyRole())) {
    return NextResponse.json({ ok: false, error: "Hanya jurulatih/admin." }, { status: 403 });
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
  const allowed = new Set(ALL_MATCH_KEYS);
  const stats: Record<string, number> = {};
  for (const [k, v] of Object.entries(parsed.data.stats)) {
    if (allowed.has(k)) stats[k] = v;
  }

  const supabase = await createServerSupabase();
  const { error } = await supabase.from("match_stats").upsert(
    {
      match_id: parsed.data.matchId,
      user_id: parsed.data.targetUserId,
      stats,
    },
    { onConflict: "match_id,user_id" }
  );
  if (error) {
    console.error("[coach/match-stat] gagal:", error.message);
    return NextResponse.json({ ok: false, error: "Gagal simpan prestasi." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  if (!isCoach(await getMyRole())) {
    return NextResponse.json({ ok: false, error: "Hanya jurulatih/admin." }, { status: 403 });
  }
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ ok: false, error: "id diperlukan." }, { status: 400 });
  const supabase = await createServerSupabase();
  const { error } = await supabase.from("match_stats").delete().eq("id", id);
  if (error) {
    console.error("[coach/match-stat] padam gagal:", error.message);
    return NextResponse.json({ ok: false, error: "Gagal padam." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
