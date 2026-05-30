import { NextResponse } from "next/server";
import { registerSchema } from "@/lib/schema";

// Placeholder endpoint pendaftaran Pencarian Bakat.
// Sahkan input dengan zod, log ke server, dan pulangkan kejayaan.
//
// TODO: hook to email service (Resend / SendGrid) — lihat README.md.
//   Contoh: hantar email ke hstingers@gmail.com dengan butiran pendaftar,
//   atau simpan ke pangkalan data / Google Sheet.

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

  console.log("[register] pendaftar baharu:", parsed.data);

  // TODO: hantar email / simpan rekod di sini.

  return NextResponse.json({ ok: true });
}
