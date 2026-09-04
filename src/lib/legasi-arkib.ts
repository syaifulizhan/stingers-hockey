import "server-only";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { legacyUrl } from "@/lib/legasi";
import { waybackUrl } from "@/lib/legasi-arkib-url";

// ============================================================================
// Salinan arkib — jaring terakhir untuk Hall of Honour.
//
// Semua lapisan lain melindungi daripada kegagalan DALAM sistem ini: RLS
// melindungi draf, snapshot melindungi daripada DB mati, versi melindungi
// sejarah. Lapisan ini melindungi daripada kegagalan SISTEM ITU SENDIRI —
// hari hoki.my tidak lagi wujud.
//
// Bila itu berlaku, URL yang bercetak pada kad fizikal masih boleh ditampal
// ke Wayback Machine dan rekod itu keluar semula.
// ============================================================================

const SAVE_ENDPOINT = "https://web.archive.org/save/";

export type HasilArkib = {
  slug: string;
  url: string;
  ok: boolean;
  archiveUrl?: string;
  error?: string;
};

export { waybackUrl };

/**
 * Hantar satu alamat ke Internet Archive.
 *
 * Kegagalan di sini TIDAK PERNAH boleh menghalang penerbitan — arkib ialah
 * bonus, bukan syarat. Jadi setiap ralat ditangkap dan dipulangkan, bukan
 * dilempar.
 */
export async function arkibkanSatu(slug: string, timeoutMs = 25_000): Promise<HasilArkib> {
  const url = legacyUrl(slug);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    // `manual` dengan sengaja: apabila simpanan berjaya, Wayback membalas 302
    // dengan header `location` yang membawa URL snapshot BERTARIKH. Mengikut
    // redirect akan membuang header itu dan meninggalkan kita hanya dengan
    // alamat wildcard. Ini disahkan terhadap endpoint sebenar.
    const res = await fetch(`${SAVE_ENDPOINT}${url}`, {
      method: "GET",
      redirect: "manual",
      signal: controller.signal,
      headers: { "User-Agent": "stingers-hockey-legasi-archiver/1.0 (+https://hoki.my)" },
    });

    const lokasi = res.headers.get("location");
    if (lokasi && lokasi.includes("/web/")) {
      return { slug, url, ok: true, archiveUrl: lokasi };
    }

    // 200 tanpa redirect masih bermakna permintaan diterima; kita cuma tidak
    // tahu cap masa snapshotnya, jadi tunjuk alamat wildcard.
    if (res.ok || res.status === 302) {
      return { slug, url, ok: true, archiveUrl: waybackUrl(slug) };
    }

    return { slug, url, ok: false, error: `Wayback membalas ${res.status}` };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { slug, url, ok: false, error: msg };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Arkibkan setiap rekod tersiar dan catat bila ia berlaku.
 *
 * Dijalankan oleh cron harian. Menghantar satu demi satu, bukan serentak:
 * Wayback mengehadkan kadar, dan tiada apa yang mendesak di sini.
 */
export async function arkibkanSemua(): Promise<HasilArkib[]> {
  let sb: ReturnType<typeof createSupabaseAdmin>;
  try {
    sb = createSupabaseAdmin();
  } catch (err) {
    console.error("[legasi-arkib] klien admin gagal:", err);
    return [];
  }

  const { data, error } = await sb
    .from("legacy_records")
    .select("id, slug")
    .eq("status", "published");

  if (error || !data) {
    console.error("[legasi-arkib] gagal membaca rekod:", error?.message);
    return [];
  }

  const hasil: HasilArkib[] = [];
  for (const r of data as { id: string; slug: string }[]) {
    const h = await arkibkanSatu(r.slug);
    hasil.push(h);

    if (h.ok) {
      const { error: upErr } = await sb
        .from("legacy_records")
        .update({ archived_at: new Date().toISOString(), archive_url: h.archiveUrl })
        .eq("id", r.id);
      // Lajur mungkin belum wujud jika migrasi kedua belum dijalankan —
      // arkib itu sendiri tetap berjaya, jadi ini tidak dianggap kegagalan.
      if (upErr) console.error("[legasi-arkib] gagal mencatat masa arkib:", upErr.message);
    }
  }

  return hasil;
}
