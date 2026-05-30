import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase/server";

// Coach kemas kini status hantaran ahli (semak / minta ulang).
const schema = z.object({
  submissionId: z.string().uuid(),
  status: z.enum(["submitted", "reviewed", "revise"]),
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
  const { data, error } = await supabase
    .from("submissions")
    .update({ status: parsed.data.status })
    .eq("id", parsed.data.submissionId)
    .select("user_id")
    .maybeSingle();

  if (error) {
    console.error("[coach/review] gagal:", error.message);
    return NextResponse.json({ ok: false, error: "Gagal kemas kini." }, { status: 403 });
  }

  // Notifikasi kepada ahli yang menghantar.
  if (data?.user_id && parsed.data.status !== "submitted") {
    const title =
      parsed.data.status === "reviewed"
        ? "Tugasan anda telah disemak ✓"
        : "Jurulatih minta anda ulang tugasan";
    await supabase.from("notifications").insert({
      user_id: data.user_id,
      title,
      link: "/portal/dashboard",
    });
  }

  return NextResponse.json({ ok: true });
}
