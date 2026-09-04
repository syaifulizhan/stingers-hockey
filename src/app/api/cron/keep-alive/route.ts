import { NextResponse } from "next/server";
import { createPublicSupabase } from "@/lib/supabase/public";
import { arkibkanSemua } from "@/lib/legasi-arkib";

// Cron keep-alive — query ringan ke Supabase supaya projek free-tier tidak
// auto-pause selepas 7 hari tiada aktiviti (jika DB pause, seluruh laman
// rosak). Dipanggil oleh Vercel Cron sekali sehari; lihat vercel.json.
//
// Cron ini juga menghantar setiap rekod Hall of Honour ke Internet Archive.
// Ia dibonceng di sini dengan sengaja: pelan Hobby mengehadkan bilangan cron,
// dan harian ialah kadar yang betul untuk kedua-dua tugas.
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

  // Arkib tidak boleh menjatuhkan keep-alive — itu tugas utama cron ini.
  let arkib: { cuba: number; berjaya: number } = { cuba: 0, berjaya: 0 };
  try {
    const hasil = await arkibkanSemua();
    arkib = { cuba: hasil.length, berjaya: hasil.filter((h) => h.ok).length };
  } catch (err) {
    console.error("[cron] arkib legasi gagal:", err);
  }

  return NextResponse.json({
    ok: true,
    pinged: "news",
    rows: count ?? 0,
    arkib,
    at: new Date().toISOString(),
  });
}
