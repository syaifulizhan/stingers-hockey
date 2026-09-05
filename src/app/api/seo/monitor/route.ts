import { NextResponse } from "next/server";
import { jalankanAudit } from "@/lib/seo-audit";

// Audit SEO atas permintaan. Logiknya berada dalam lib/seo-audit.ts kerana
// cron harian menjalankannya juga — lihat /api/seo/auto-boost.
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    return NextResponse.json(await jalankanAudit());
  } catch (error) {
    console.error("[seo/monitor] gagal:", error);
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return GET(request);
}
