import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase/server";
import { getMyRole, isCoach } from "@/lib/portal-auth";

// Jurulatih/admin cipta & urus season perlawanan.
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
  const parsed = z
    .object({
      name: z.string().trim().min(1, { message: "Nama season diperlukan." }).max(80),
      team: z.enum(["lelaki", "perempuan"]).default("lelaki"),
    })
    .safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Data tidak sah." }, { status: 422 });
  }
  const supabase = await createServerSupabase();
  const { error } = await supabase
    .from("seasons")
    .insert({ name: parsed.data.name, team: parsed.data.team, created_by: userId });
  if (error) {
    console.error("[coach/season] gagal:", error.message);
    return NextResponse.json({ ok: false, error: "Gagal cipta season." }, { status: 500 });
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
  const parsed = z
    .object({
      id: z.string().uuid(),
      name: z.string().trim().min(1).max(80).optional(),
      team: z.enum(["lelaki", "perempuan"]).optional(),
      closed: z.boolean().optional(),
    })
    .safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Data tidak sah." }, { status: 422 });
  }
  const { id, name, team, closed } = parsed.data;
  const update: Record<string, unknown> = {};
  if (name !== undefined) update.name = name;
  if (team !== undefined) update.team = team;
  if (closed !== undefined) update.closed = closed;
  if (Object.keys(update).length === 0) {
    return NextResponse.json({ ok: false, error: "Tiada perubahan." }, { status: 422 });
  }
  // Nota: created_at TIDAK diubah → susunan kekal.
  const supabase = await createServerSupabase();
  const { error } = await supabase.from("seasons").update(update).eq("id", id);
  if (error) {
    console.error("[coach/season] tutup gagal:", error.message);
    return NextResponse.json({ ok: false, error: "Gagal kemas kini season." }, { status: 500 });
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
  const { error } = await supabase.from("seasons").delete().eq("id", id);
  if (error) {
    console.error("[coach/season] padam gagal:", error.message);
    return NextResponse.json({ ok: false, error: "Gagal padam season." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
