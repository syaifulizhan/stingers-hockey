import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase/server";

// Coach cipta tugasan. assignedTo kosong = semua ahli.
const schema = z.object({
  title: z.string().trim().min(1, { message: "Tajuk diperlukan." }).max(200),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  dueDate: z.string().optional().or(z.literal("")),
  assignedTo: z.string().optional().or(z.literal("")),
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
  const d = parsed.data;

  const supabase = await createServerSupabase();
  const { error } = await supabase.from("tasks").insert({
    title: d.title,
    description: d.description || null,
    due_date: d.dueDate || null,
    assigned_to: d.assignedTo || null,
    created_by: userId,
  });

  if (error) {
    console.error("[coach/task] gagal:", error.message);
    return NextResponse.json(
      { ok: false, error: "Gagal cipta tugasan (mungkin anda bukan jurulatih)." },
      { status: 403 }
    );
  }
  return NextResponse.json({ ok: true });
}

// Padam tugasan (RLS: hanya coach/admin). Hantaran berkaitan turut terpadam (cascade).
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
  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) {
    console.error("[coach/task] padam gagal:", error.message);
    return NextResponse.json({ ok: false, error: "Gagal padam." }, { status: 403 });
  }
  return NextResponse.json({ ok: true });
}
