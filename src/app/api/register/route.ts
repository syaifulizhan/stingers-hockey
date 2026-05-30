import { NextResponse } from "next/server";
import { registerSchema } from "@/lib/schema";

// Endpoint pendaftaran Pencarian Bakat.
// 1. Sahkan input dengan zod.
// 2. Forward ke Google Apps Script webhook → tambah baris ke Google Sheet.
//
// Set env var SHEETS_WEBHOOK_URL (local: .env.local, prod: Vercel env vars)
// kepada URL Web App Apps Script. Lihat README.md §4 + google-apps-script.gs.

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Badan permintaan tidak sah." },
      { status: 400 }
    );
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, errors: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const webhookUrl = process.env.SHEETS_WEBHOOK_URL;
  if (!webhookUrl) {
    console.error(
      "[register] SHEETS_WEBHOOK_URL belum diset — data TIDAK disimpan:",
      parsed.data
    );
    return NextResponse.json(
      { ok: false, error: "Servis pendaftaran belum dikonfigurasi." },
      { status: 503 }
    );
  }

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...parsed.data,
        submittedAt: new Date().toISOString(),
      }),
    });

    if (!res.ok) {
      console.error("[register] webhook gagal:", res.status, await res.text());
      return NextResponse.json(
        { ok: false, error: "Gagal menyimpan pendaftaran." },
        { status: 502 }
      );
    }
  } catch (err) {
    console.error("[register] ralat menghubungi webhook:", err);
    return NextResponse.json(
      { ok: false, error: "Gagal menyimpan pendaftaran." },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true });
}
