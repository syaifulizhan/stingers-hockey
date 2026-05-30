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
  const { error } = await supabase.from("submissions").upsert(
    {
      task_id: parsed.data.taskId,
      user_id: userId,
      content: parsed.data.content,
      status: "submitted",
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
