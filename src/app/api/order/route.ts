import { NextResponse } from "next/server";
import { orderSchema, UNIT_PRICE } from "@/lib/order-schema";

// Endpoint tempahan Hustle Gear (training kit).
// 1. Sahkan input dengan zod.
// 2. Forward ke Google Apps Script webhook → tambah baris ke Google Sheet.
//
// Guna env var SHEETS_WEBHOOK_URL yang sama dengan pendaftaran.
// Apps Script mengasingkan baris ke sheet "Tempahan Hustle Gear"
// berdasarkan medan formType. Lihat google-apps-script.gs.

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

  const parsed = orderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, errors: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const webhookUrl = process.env.SHEETS_WEBHOOK_URL;
  if (!webhookUrl) {
    console.error(
      "[order] SHEETS_WEBHOOK_URL belum diset — data TIDAK disimpan:",
      parsed.data
    );
    return NextResponse.json(
      { ok: false, error: "Servis tempahan belum dikonfigurasi." },
      { status: 503 }
    );
  }

  // Kira semula harga di server (jangan percaya nilai dari klien).
  const unitPrice = UNIT_PRICE;
  const total = parsed.data.quantity * unitPrice;

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        formType: "hustle-gear",
        ...parsed.data,
        unitPrice,
        total,
        submittedAt: new Date().toISOString(),
      }),
    });

    if (!res.ok) {
      console.error("[order] webhook gagal:", res.status, await res.text());
      return NextResponse.json(
        { ok: false, error: "Gagal menyimpan tempahan." },
        { status: 502 }
      );
    }
  } catch (err) {
    console.error("[order] ralat menghubungi webhook:", err);
    return NextResponse.json(
      { ok: false, error: "Gagal menyimpan tempahan." },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true });
}
