import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createServerSupabase } from "@/lib/supabase/server";

type NotifRow = {
  id: string;
  title: string;
  body: string | null;
  link: string | null;
  created_at: string;
};

// GET — senarai notifikasi + bilangan belum dibaca.
export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Sila log masuk." }, { status: 401 });
  }

  const supabase = await createServerSupabase();
  const [meRes, itemsRes] = await Promise.all([
    supabase.from("users").select("last_seen_notifications").eq("clerk_user_id", userId).maybeSingle(),
    supabase
      .from("notifications")
      .select("id, title, body, link, created_at")
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const items = (itemsRes.data ?? []) as unknown as NotifRow[];
  const lastSeenRaw = (meRes.data as { last_seen_notifications: string | null } | null)
    ?.last_seen_notifications;
  const lastSeen = lastSeenRaw ? new Date(lastSeenRaw).getTime() : 0;
  const unread = items.filter((n) => new Date(n.created_at).getTime() > lastSeen).length;

  return NextResponse.json({ ok: true, items, unread });
}

// POST — tanda semua notifikasi sebagai sudah dibaca (kemas kini masa terakhir lihat).
export async function POST() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Sila log masuk." }, { status: 401 });
  }
  const supabase = await createServerSupabase();
  const { error } = await supabase
    .from("users")
    .update({ last_seen_notifications: new Date().toISOString() })
    .eq("clerk_user_id", userId);
  if (error) {
    console.error("[notifications] tandai dibaca gagal:", error.message);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
