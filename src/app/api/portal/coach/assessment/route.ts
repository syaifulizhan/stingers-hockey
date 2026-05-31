import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase/server";
import { getMyRole, isCoach } from "@/lib/portal-auth";
import { ASSESSMENT_METRICS, type AssessmentType } from "@/lib/assessments";

// Jurulatih/admin simpan penilaian (kemahiran / jurulatih). Skala 1–10.
const schema = z.object({
  targetUserId: z.string().min(1),
  type: z.enum(["skill_field", "skill_gk", "coach_eval"]),
  assessedOn: z.string().optional().or(z.literal("")),
  scores: z.record(z.string(), z.number().int().min(1).max(10)),
  note: z.string().max(500).optional().or(z.literal("")),
});

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!isCoach(await getMyRole())) {
    return NextResponse.json(
      { ok: false, error: "Hanya jurulatih/admin boleh menilai." },
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

  // Hanya benarkan kunci metrik yang sah bagi jenis ini.
  const allowed = new Set(
    ASSESSMENT_METRICS[d.type as AssessmentType].map((m) => m.key)
  );
  const scores: Record<string, number> = {};
  for (const [k, v] of Object.entries(d.scores)) {
    if (allowed.has(k)) scores[k] = v;
  }
  if (Object.keys(scores).length === 0) {
    return NextResponse.json({ ok: false, error: "Tiada skor sah." }, { status: 422 });
  }

  const supabase = await createServerSupabase();
  const { error } = await supabase.from("assessments").insert({
    user_id: d.targetUserId,
    assessor: userId,
    type: d.type,
    assessed_on: d.assessedOn || undefined,
    scores,
    note: d.note || null,
  });

  if (error) {
    console.error("[coach/assessment] gagal:", error.message);
    return NextResponse.json({ ok: false, error: "Gagal simpan penilaian." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

// Padam satu penilaian.
export async function DELETE(request: Request) {
  if (!isCoach(await getMyRole())) {
    return NextResponse.json({ ok: false, error: "Tidak dibenarkan." }, { status: 403 });
  }
  const id = new URL(request.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ ok: false, error: "id diperlukan." }, { status: 400 });
  }
  const supabase = await createServerSupabase();
  const { error } = await supabase.from("assessments").delete().eq("id", id);
  if (error) {
    console.error("[coach/assessment] padam gagal:", error.message);
    return NextResponse.json({ ok: false, error: "Gagal padam." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
