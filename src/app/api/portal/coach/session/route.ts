import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase/server";

// Coach cipta sesi latihan (untuk rekod kehadiran).
const schema = z.object({
  title: z.string().trim().min(1, { message: "Tajuk diperlukan." }).max(200),
  date: z.string().optional().or(z.literal("")),
});

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Sila log masuk." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Permintaan tidak sah." }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, errors: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const supabase = await createServerSupabase();
  const { error } = await supabase.from("sessions").insert({
    title: parsed.data.title,
    date: parsed.data.date || null,
    created_by: userId,
  });

  if (error) {
    console.error("[coach/session] gagal:", error.message);
    return NextResponse.json(
      { ok: false, error: "Gagal cipta sesi (mungkin anda bukan jurulatih)." },
      { status: 403 }
    );
  }
  return NextResponse.json({ ok: true });
}

// Edit sesi (tajuk / tarikh).
const editSchema = z.object({
  id: z.string().uuid(),
  title: z.string().trim().min(1, { message: "Tajuk diperlukan." }).max(200),
  date: z.string().optional().or(z.literal("")),
});

export async function PATCH(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Sila log masuk." }, { status: 401 });
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Permintaan tidak sah." }, { status: 400 });
  }
  const parsed = editSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Data tidak sah." }, { status: 422 });
  }
  const supabase = await createServerSupabase();
  const { error } = await supabase
    .from("sessions")
    .update({ title: parsed.data.title, date: parsed.data.date || null })
    .eq("id", parsed.data.id);
  if (error) {
    console.error("[coach/session] edit gagal:", error.message);
    return NextResponse.json({ ok: false, error: "Gagal kemas kini sesi." }, { status: 403 });
  }
  return NextResponse.json({ ok: true });
}

// Padam sesi (kehadiran berkaitan turut terpadam — cascade).
export async function DELETE(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Sila log masuk." }, { status: 401 });
  }
  const id = new URL(request.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ ok: false, error: "id diperlukan." }, { status: 400 });
  }
  const supabase = await createServerSupabase();
  const { error } = await supabase.from("sessions").delete().eq("id", id);
  if (error) {
    console.error("[coach/session] padam gagal:", error.message);
    return NextResponse.json({ ok: false, error: "Gagal padam sesi." }, { status: 403 });
  }
  return NextResponse.json({ ok: true });
}
