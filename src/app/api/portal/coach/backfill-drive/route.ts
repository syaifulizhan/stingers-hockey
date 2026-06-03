import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { pushImageToDrive } from "@/lib/drive";
import { preferredName } from "@/lib/names";

// Backfill SEKALI sahaja: pindah SEMUA bukti hantaran yang sudah "Disemak"
// (reviewed) tetapi gambarnya masih dalam Supabase → ke Google Drive, kemudian
// clear storan. Merangkumi hantaran dari task arkib juga. Data hantaran KEKAL.
// Nama fail = nama yang coach beri kepada pemain + tarikh hantaran asal.

const dateMY = (iso: string) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kuala_Lumpur" }).format(new Date(iso));

export async function POST() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Sila log masuk." }, { status: 401 });
  }

  const supabase = await createServerSupabase();

  // Hantaran reviewed yang masih ada gambar (RLS: hanya coach nampak semua).
  const { data: subs, error } = await supabase
    .from("submissions")
    .select("id, user_id, media_url, submitted_at")
    .eq("status", "reviewed")
    .not("media_url", "is", null);

  if (error) {
    console.error("[backfill-drive] gagal baca:", error.message);
    return NextResponse.json({ ok: false, error: "Gagal baca hantaran." }, { status: 403 });
  }

  type Sub = { id: string; user_id: string; media_url: string; submitted_at: string };
  const rows = (subs ?? []) as Sub[];

  if (rows.length === 0) {
    return NextResponse.json({ ok: true, moved: 0, failed: 0, errors: [] });
  }

  // Peta nama pemain (display_name = nama yang coach beri).
  const { data: users } = await supabase
    .from("users")
    .select("clerk_user_id, full_name, display_name");
  const nameById = new Map(
    ((users ?? []) as { clerk_user_id: string; full_name: string | null; display_name: string | null }[]).map(
      (u) => [u.clerk_user_id, preferredName(u.full_name, u.display_name)]
    )
  );

  let moved = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const s of rows) {
    const playerName = nameById.get(s.user_id) || "Pemain";
    const drive = await pushImageToDrive({
      target: "tugasan",
      imageUrl: s.media_url,
      fileName: `${playerName} - ${dateMY(s.submitted_at)}`,
    });
    if (!drive.ok) {
      failed++;
      errors.push(`${playerName}: ${drive.error}`);
      continue;
    }

    // Clear storan + null-kan media_url (data hantaran kekal).
    const marker = "/task-proof/";
    const i = s.media_url.indexOf(marker);
    if (i !== -1) {
      await supabase.storage
        .from("task-proof")
        .remove([decodeURIComponent(s.media_url.slice(i + marker.length))]);
    }
    await supabase.from("submissions").update({ media_url: null }).eq("id", s.id);
    moved++;
  }

  return NextResponse.json({ ok: true, moved, failed, errors });
}
