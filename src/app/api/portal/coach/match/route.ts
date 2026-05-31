import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase/server";
import { getMyRole, isCoach } from "@/lib/portal-auth";

const base = {
  opponent: z.string().trim().min(1, { message: "Nama lawan diperlukan." }).max(120),
  seasonId: z.string().uuid().nullable().optional(),
  matchDate: z.string().optional().or(z.literal("")),
  venue: z.string().max(120).optional().or(z.literal("")),
  competition: z.string().max(120).optional().or(z.literal("")),
  ourScore: z.number().int().min(0).max(99).nullable().optional(),
  oppScore: z.number().int().min(0).max(99).nullable().optional(),
};

function row(d: {
  opponent: string;
  seasonId?: string | null;
  matchDate?: string;
  venue?: string;
  competition?: string;
  ourScore?: number | null;
  oppScore?: number | null;
}) {
  return {
    opponent: d.opponent,
    season_id: d.seasonId ?? null,
    match_date: d.matchDate || null,
    venue: d.venue || null,
    competition: d.competition || null,
    our_score: d.ourScore ?? null,
    opp_score: d.oppScore ?? null,
  };
}

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
  const parsed = z.object(base).safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Data tidak sah." }, { status: 422 });
  }
  const supabase = await createServerSupabase();
  const { error } = await supabase
    .from("matches")
    .insert({ ...row(parsed.data), created_by: userId });
  if (error) {
    console.error("[coach/match] gagal:", error.message);
    return NextResponse.json({ ok: false, error: "Gagal cipta perlawanan." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

export async function PATCH(request: Request) {
  if (!isCoach(await getMyRole())) {
    return NextResponse.json({ ok: false, error: "Hanya jurulatih/admin." }, { status: 403 });
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Permintaan tidak sah." }, { status: 400 });
  }
  const parsed = z.object({ id: z.string().uuid(), ...base }).safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Data tidak sah." }, { status: 422 });
  }
  const supabase = await createServerSupabase();
  const { error } = await supabase.from("matches").update(row(parsed.data)).eq("id", parsed.data.id);
  if (error) {
    console.error("[coach/match] edit gagal:", error.message);
    return NextResponse.json({ ok: false, error: "Gagal kemas kini." }, { status: 500 });
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
  const { error } = await supabase.from("matches").delete().eq("id", id);
  if (error) {
    console.error("[coach/match] padam gagal:", error.message);
    return NextResponse.json({ ok: false, error: "Gagal padam." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
