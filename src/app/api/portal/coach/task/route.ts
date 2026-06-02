import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase/server";

// Coach cipta tugasan. assignedTo kosong = semua ahli.
// Pengecualian dalam tugasan umum: ahli + arahan/limit khas.
const exceptionSchema = z
  .array(z.object({ uid: z.string().min(1), note: z.string().trim().min(1).max(500) }))
  .max(50)
  .optional();

const schema = z.object({
  title: z.string().trim().min(1, { message: "Tajuk diperlukan." }).max(200),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  dueDate: z.string().optional().or(z.literal("")),
  assignedTo: z.string().optional().or(z.literal("")),
  exceptions: exceptionSchema,
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
  const { data: created, error } = await supabase
    .from("tasks")
    .insert({
      title: d.title,
      description: d.description || null,
      due_date: d.dueDate || null,
      assigned_to: d.assignedTo || null,
      // Pengecualian hanya untuk tugasan umum (Semua ahli).
      exceptions: d.assignedTo ? [] : d.exceptions ?? [],
      created_by: userId,
    })
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("[coach/task] gagal:", error.message);
    return NextResponse.json(
      { ok: false, error: "Gagal cipta tugasan (mungkin anda bukan jurulatih)." },
      { status: 403 }
    );
  }

  // Notifikasi (kepada ahli tertentu, atau broadcast jika "Semua ahli").
  // ref_* supaya notifikasi turut terpadam bila tugasan dipadam.
  await supabase.from("notifications").insert({
    user_id: d.assignedTo || null,
    title: `Tugasan baharu: ${d.title}`,
    link: "/portal/dashboard",
    ref_type: "task",
    ref_id: created?.id ?? null,
  });

  return NextResponse.json({ ok: true });
}

// Edit tugasan.
const editSchema = z.object({
  id: z.string().uuid(),
  title: z.string().trim().min(1, { message: "Tajuk diperlukan." }).max(200),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  dueDate: z.string().optional().or(z.literal("")),
  assignedTo: z.string().optional().or(z.literal("")),
  exceptions: exceptionSchema,
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
  const d = parsed.data;
  const supabase = await createServerSupabase();
  const { error } = await supabase
    .from("tasks")
    .update({
      title: d.title,
      description: d.description || null,
      due_date: d.dueDate || null,
      assigned_to: d.assignedTo || null,
      exceptions: d.assignedTo ? [] : d.exceptions ?? [],
    })
    .eq("id", d.id);
  if (error) {
    console.error("[coach/task] edit gagal:", error.message);
    return NextResponse.json({ ok: false, error: "Gagal kemas kini tugasan." }, { status: 403 });
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

  // Hantaran task ini akan terpadam (cascade) — ambil id-nya dulu supaya
  // notifikasi "disemak/minta ulang" berkaitan turut boleh dipadam.
  const { data: subs } = await supabase.from("submissions").select("id").eq("task_id", id);
  const subIds = (subs ?? []).map((s) => s.id as string);

  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) {
    console.error("[coach/task] padam gagal:", error.message);
    return NextResponse.json({ ok: false, error: "Gagal padam." }, { status: 403 });
  }

  // Buang notifikasi berkaitan supaya tak tertinggal di loceng.
  await supabase.from("notifications").delete().eq("ref_type", "task").eq("ref_id", id);
  if (subIds.length > 0) {
    await supabase.from("notifications").delete().eq("ref_type", "submission").in("ref_id", subIds);
  }

  return NextResponse.json({ ok: true });
}
