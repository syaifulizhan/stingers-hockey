import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase/server";

// Coach tanda kehadiran seorang ahli untuk satu sesi.
const schema = z.object({
  sessionId: z.string().uuid({ message: "Sesi tidak sah." }),
  userId: z.string().min(1),
  status: z.enum(["present", "absent", "excused"]),
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
    return NextResponse.json({ ok: false, error: "Data tidak sah." }, { status: 422 });
  }

  const supabase = await createServerSupabase();
  const { error } = await supabase.from("attendance").upsert(
    {
      session_id: parsed.data.sessionId,
      user_id: parsed.data.userId,
      status: parsed.data.status,
      recorded_by: userId,
    },
    { onConflict: "session_id,user_id" }
  );

  if (error) {
    console.error("[coach/attendance] gagal:", error.message);
    return NextResponse.json(
      { ok: false, error: "Gagal rekod kehadiran." },
      { status: 403 }
    );
  }
  return NextResponse.json({ ok: true });
}
