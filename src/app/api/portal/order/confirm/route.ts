import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase/server";
import { pushImageToDrive, firstThreeWords, todayMY } from "@/lib/drive";

// Admin "Sah" tempahan → pindah bukti bayaran ke Google Drive, kemudian buang
// fail dari Supabase Storage (jimat storan). Baris tempahan & semua data KEKAL.
// Nama fail Drive = 3 patah nama pertama pembeli + tarikh.
const schema = z.object({ orderId: z.string().uuid() });

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Sila log masuk." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Permintaan tidak sah." }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Data tidak sah." }, { status: 422 });
  }

  const supabase = await createServerSupabase();
  const { data: order, error } = await supabase
    .from("shop_orders")
    .select("full_name, proof_url")
    .eq("id", parsed.data.orderId)
    .maybeSingle();

  if (error || !order) {
    return NextResponse.json({ ok: false, error: "Tempahan tidak dijumpai." }, { status: 404 });
  }

  const proofUrl = (order as { proof_url: string | null }).proof_url;
  const fullName = (order as { full_name: string }).full_name;

  // Jika ada bukti: pindah ke Drive DULU. Hanya teruskan bila Drive berjaya —
  // jadi bukti bayaran sentiasa terselamat sebelum apa-apa dipadam.
  let driveUrl: string | null = null;
  if (proofUrl) {
    const drive = await pushImageToDrive({
      target: "tempahan",
      imageUrl: proofUrl,
      fileName: `${firstThreeWords(fullName)} - ${todayMY()}`,
    });
    if (!drive.ok) {
      console.error("[order/confirm] Drive gagal:", drive.error);
      return NextResponse.json(
        { ok: false, error: "Gagal simpan gambar ke Drive. Status tidak diubah." },
        { status: 502 }
      );
    }
    driveUrl = drive.fileUrl;
  }

  // Update DB DULU (rekod = sumber kebenaran). Bukti kini ada di Drive.
  const { error: upErr } = await supabase
    .from("shop_orders")
    .update({ status: "disahkan", proof_url: null, proof_drive_url: driveUrl })
    .eq("id", parsed.data.orderId);
  if (upErr) {
    // Bukti masih di Supabase + proof_url utuh → boleh cuba "Sah" semula.
    console.error("[order/confirm] update gagal:", upErr.message);
    return NextResponse.json({ ok: false, error: "Gagal kemas kini status." }, { status: 403 });
  }

  // Padam fail storan SELEPAS DB dikemas kini (best-effort; gagal = orphan
  // kecil sahaja, bukti sudah selamat di Drive & rekod sudah betul).
  if (proofUrl) {
    const i = proofUrl.indexOf("/shop/");
    if (i !== -1) {
      await supabase.storage.from("shop").remove([decodeURIComponent(proofUrl.slice(i + 6))]);
    }
  }

  return NextResponse.json({ ok: true });
}
