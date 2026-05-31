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
  const { error } = await supabase
    .from("users")
    .upsert(rows, { onConflict: "clerk_user_id", ignoreDuplicates: true });

  if (error) {
    console.error("[coach/sync-clerk] gagal:", error.message);
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, total: rows.length });
}
