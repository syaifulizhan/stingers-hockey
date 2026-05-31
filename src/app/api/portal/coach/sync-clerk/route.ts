import { NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { getMyRole, isAdmin } from "@/lib/portal-auth";

// Segerak SEMUA pengguna Clerk → jadual Supabase `users`.
// Berguna untuk masukkan ahli yang dah sign up di Clerk tetapi belum pernah
// buka portal (jadi belum ada baris). HANYA admin boleh jalankan.
// ignoreDuplicates: TIDAK menimpa profil sedia ada.
export async function POST() {
  const role = await getMyRole();
  if (!isAdmin(role)) {
    return NextResponse.json(
      { ok: false, error: "Hanya admin boleh segerak pengguna." },
      { status: 403 }
    );
  }

  const client = await clerkClient();

  // Ambil semua pengguna Clerk (halaman demi halaman, 100 setiap satu).
  const rows: {
    clerk_user_id: string;
    full_name: string | null;
    email: string | null;
    profile_complete: boolean;
  }[] = [];
  const limit = 100;
  let offset = 0;

  while (true) {
    const res = await client.users.getUserList({ limit, offset });
    for (const u of res.data) {
      const fullName =
        u.username || [u.firstName, u.lastName].filter(Boolean).join(" ") || null;
      const email =
        u.emailAddresses.find((e) => e.id === u.primaryEmailAddressId)
          ?.emailAddress ??
        u.emailAddresses[0]?.emailAddress ??
        null;
      rows.push({
        clerk_user_id: u.id,
        full_name: fullName,
        email,
        profile_complete: false,
      });
    }
    if (res.data.length < limit) break;
    offset += limit;
  }

  if (rows.length === 0) {
    return NextResponse.json({ ok: true, total: 0 });
  }

  const supabase = await createServerSupabase();

  // Status sedia ada: tahu siapa baru, siapa belum lengkap profil.
  const { data: existingRows } = await supabase
    .from("users")
    .select("clerk_user_id, profile_complete");
  const existing = new Map(
    (existingRows ?? []).map((r) => [r.clerk_user_id as string, r.profile_complete as boolean])
  );

  // 1. Sisipkan ahli BARU (yang belum ada baris).
  const toInsert = rows.filter((r) => !existing.has(r.clerk_user_id));
  if (toInsert.length > 0) {
    const { error } = await supabase.from("users").insert(toInsert);
    if (error) {
      console.error("[coach/sync-clerk] insert gagal:", error.message);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
  }

  // 2. Kemas kini nama (username Clerk) untuk baris sedia ada yang profil
  //    BELUM lengkap — tidak menyentuh ahli yang sudah isi profil sebenar.
  for (const r of rows) {
    if (existing.get(r.clerk_user_id) === false) {
      await supabase
        .from("users")
        .update({ full_name: r.full_name, email: r.email })
        .eq("clerk_user_id", r.clerk_user_id)
        .eq("profile_complete", false);
    }
  }

  return NextResponse.json({ ok: true, total: rows.length, inserted: toInsert.length });
}
