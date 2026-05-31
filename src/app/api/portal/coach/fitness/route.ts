import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase/server";
import { getMyRole, isCoach } from "@/lib/portal-auth";
import { FITNESS_METRICS } from "@/lib/fitness";

// Jurulatih/admin rekod keputusan ujian kecergasan.
const schema = z.object({
  targetUserId: z.string().min(1),
  occasion: z.string().max(80).optional().or(z.literal("")),
  testedOn: z.string().optional().or(z.literal("")),
  results: z.record(z.string(), z.number().nonnegative()),
});

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!isCoach(await getMyRole())) {
    return NextResponse.json(
      { ok: false, error: "Hanya jurulatih/admin boleh rekod." },
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
  const d = parsed.data;

  // Hanya simpan kunci metrik yang sah.
  const allowed = new Set(FITNESS_METRICS.map((m) => m.key));
  const results: Record<string, number> = {};
  for (const [k, v] of Object.entries(d.results)) {
    if (allowed.has(k)) results[k] = v;
  }
  if (Object.keys(results).length === 0) {
    return NextResponse.json({ ok: false, error: "Sila isi sekurang-kurangnya satu ujian." }, { status: 422 });
  }

  const supabase = await createServerSupabase();
  const { error } = await supabase.from("fitness_tests").insert({
    user_id: d.targetUserId,
    assessor: userId,
    occasion: d.occasion || null,
    tested_on: d.testedOn || undefined,
    results,
  });

  if (error) {
    console.error("[coach/fitness] gagal:", error.message);
    return NextResponse.json({ ok: false, error: "Gagal simpan ujian." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  if (!isCoach(await getMyRole())) {
    return NextResponse.json({ ok: false, error: "Tidak dibenarkan." }, { status: 403 });
  }
  const id = new URL(request.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ ok: false, error: "id diperlukan." }, { status: 400 });
  }
  const supabase = await createServerSupabase();
  const { error } = await supabase.from("fitness_tests").delete().eq("id", id);
  if (error) {
    console.error("[coach/fitness] padam gagal:", error.message);
    return NextResponse.json({ ok: false, error: "Gagal padam." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
