import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase/server";
import { getMyRole, isCoach } from "@/lib/portal-auth";

const schema = z.object({
  category: z.enum(["individual", "team"]),
  award: z.string().trim().min(1, { message: "Anugerah diperlukan." }).max(80),
  playerId: z.string().optional().or(z.literal("")),
  event: z.string().max(120).optional().or(z.literal("")),
  seasonId: z.string().uuid().nullable().optional(),
});

export async function POST(request: Request) {
  const { userId } = await auth();
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
  const d = parsed.data;
  if (d.category === "individual" && !d.playerId) {
    return NextResponse.json({ ok: false, error: "Sila pilih pemain." }, { status: 422 });
  }

  const supabase = await createServerSupabase();
  const { error } = await supabase.from("achievements").insert({
    category: d.category,
    award: d.award,
    player_id: d.category === "individual" ? d.playerId : null,
    event: d.event || null,
    season_id: d.seasonId ?? null,
    created_by: userId,
  });
  if (error) {
    console.error("[coach/achievement] gagal:", error.message);
    return NextResponse.json({ ok: false, error: "Gagal simpan pencapaian." }, { status: 500 });
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
  const { error } = await supabase.from("achievements").delete().eq("id", id);
  if (error) {
    console.error("[coach/achievement] padam gagal:", error.message);
    return NextResponse.json({ ok: false, error: "Gagal padam." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
