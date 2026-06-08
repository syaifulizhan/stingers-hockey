import { NextResponse } from "next/server";
import { createPublicSupabase } from "@/lib/supabase/public";

// Cron keep-alive — query ringan ke Supabase supaya projek free-tier tidak
// auto-pause selepas 7 hari tiada aktiviti (jika DB pause, seluruh laman
// rosak). Dipanggil oleh Vercel Cron sekali sehari; lihat vercel.json.
// Dilindungi CRON_SECRET: Vercel menghantar header
// `Authorization: Bearer <CRON_SECRET>` secara automatik apabila env itu wujud.
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createPublicSupabase();
  const { count, error } = await supabase
    .from("news")
    .select("*", { head: true, count: "exact" });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    pinged: "news",
    rows: count ?? 0,
    at: new Date().toISOString(),
  });
}
