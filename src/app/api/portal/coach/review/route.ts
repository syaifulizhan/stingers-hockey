import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase/server";
import { sendPush } from "@/lib/push";

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
    await sendPush(supabase, {
      userIds: [data.user_id],
      title,
      url: "/portal/dashboard",
    });
  }

  return NextResponse.json({ ok: true });
}

// Coach padam hantaran ahli (RLS: is_coach dibenarkan).
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

  // Ambil URL bukti dulu untuk buang fail dari storan.
  const { data: existing } = await supabase
    .from("submissions")
    .select("media_url")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase.from("submissions").delete().eq("id", id);
  if (error) {
    console.error("[coach/review] padam gagal:", error.message);
    return NextResponse.json({ ok: false, error: "Gagal padam." }, { status: 403 });
  }

  const mediaUrl = (existing as { media_url: string | null } | null)?.media_url ?? null;
  if (mediaUrl) {
    const marker = "/task-proof/";
    const i = mediaUrl.indexOf(marker);
    if (i !== -1) {
      const path = decodeURIComponent(mediaUrl.slice(i + marker.length));
      await supabase.storage.from("task-proof").remove([path]);
    }
  }

  return NextResponse.json({ ok: true });
}
