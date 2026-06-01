import webpush from "web-push";
import type { SupabaseClient } from "@supabase/supabase-js";

const PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const PRIVATE = process.env.VAPID_PRIVATE_KEY;
const SUBJECT = process.env.VAPID_SUBJECT || "mailto:hstingers@gmail.com";

let configured = false;
function ensure(): boolean {
  if (!PUBLIC || !PRIVATE) return false;
  if (!configured) {
    webpush.setVapidDetails(SUBJECT, PUBLIC, PRIVATE);
    configured = true;
  }
  return true;
}

type Sub = { endpoint: string; p256dh: string; auth: string };

// Hantar push ke pengguna tertentu (userIds) atau ke SEMUA (userIds = null).
// Best-effort — jika VAPID tak diset, ia senyap (app tetap berfungsi).
export async function sendPush(
  supabase: SupabaseClient,
  opts: { userIds?: string[] | null; title: string; body?: string; url?: string }
): Promise<void> {
  if (!ensure()) return;

  let q = supabase.from("push_subscriptions").select("endpoint, p256dh, auth");
  if (opts.userIds && opts.userIds.length) q = q.in("user_id", opts.userIds);
  const { data } = await q;
  const subs = (data ?? []) as Sub[];
  if (subs.length === 0) return;

  const payload = JSON.stringify({
    title: opts.title,
    body: opts.body ?? "",
    url: opts.url ?? "/portal/dashboard",
  });

  await Promise.all(
    subs.map((s) =>
      webpush
        .sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          payload
        )
        .catch(async (err: unknown) => {
          // Langganan luput → buang.
          const code = (err as { statusCode?: number })?.statusCode;
          if (code === 404 || code === 410) {
            await supabase.from("push_subscriptions").delete().eq("endpoint", s.endpoint);
          }
        })
    )
  );
}
