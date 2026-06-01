import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase/server";

// Ahli hantar / kemas kini hantaran untuk satu tugasan (kerja latihan di rumah).
const schema = z.object({
  taskId: z.string().uuid({ message: "Tugasan tidak sah." }),
  content: z
    .string()
    .trim()
    .min(1, { message: "Sila tulis sesuatu." })
    .max(2000, { message: "Terlalu panjang." }),
  mediaUrl: z.string().url().optional().or(z.literal("")),
});

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      { ok: false, error: "Sila log masuk." },
      { status: 401 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Permintaan tidak sah." },
      { status: 400 }
    );
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, errors: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const supabase = await createServerSupabase();

  // Tanda "lewat" jika dihantar selepas tarikh akhir tugasan.
  const { data: task } = await supabase
    .from("tasks")
    .select("due_date")
    .eq("id", parsed.data.taskId)
    .maybeSingle();
  let late = false;
  const due = (task as { due_date: string | null } | null)?.due_date;
  // Lewat = lepas 11:59:59pm waktu Malaysia (+08:00) pada tarikh akhir.
  if (due) late = Date.now() > new Date(`${due}T23:59:59+08:00`).getTime();

  const { error } = await supabase.from("submissions").upsert(
    {
      task_id: parsed.data.taskId,
      user_id: userId,
      content: parsed.data.content,
      media_url: parsed.data.mediaUrl || null,
      status: "submitted",
      late,
      submitted_at: new Date().toISOString(),
    },
    { onConflict: "task_id,user_id" }
  );

  if (error) {
    console.error("[portal/submission] Supabase gagal:", error.message);
    return NextResponse.json(
      { ok: false, error: "Gagal menghantar." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}

// Ahli padam hantaran sendiri untuk satu tugasan (RLS: pemilik sahaja).
export async function DELETE(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Sila log masuk." }, { status: 401 });
  }
  const taskId = new URL(request.url).searchParams.get("taskId");
  if (!taskId) {
    return NextResponse.json({ ok: false, error: "taskId diperlukan." }, { status: 400 });
  }

  const supabase = await createServerSupabase();

  // Ambil URL bukti dulu supaya boleh buang fail dari storan (jimat kuota).
  const { data: existing } = await supabase
    .from("submissions")
    .select("media_url")
    .eq("task_id", taskId)
    .eq("user_id", userId)
    .maybeSingle();

  const { error } = await supabase
    .from("submissions")
    .delete()
    .eq("task_id", taskId)
    .eq("user_id", userId);

  if (error) {
    console.error("[portal/submission] padam gagal:", error.message);
    return NextResponse.json({ ok: false, error: "Gagal padam." }, { status: 403 });
  }

  const path = taskProofPath(existing?.media_url ?? null);
  if (path) await supabase.storage.from("task-proof").remove([path]);

  return NextResponse.json({ ok: true });
}

// Ekstrak laluan fail dalam bucket "task-proof" daripada URL awam.
function taskProofPath(mediaUrl: string | null): string | null {
  if (!mediaUrl) return null;
  const marker = "/task-proof/";
  const i = mediaUrl.indexOf(marker);
  return i === -1 ? null : decodeURIComponent(mediaUrl.slice(i + marker.length));
}
