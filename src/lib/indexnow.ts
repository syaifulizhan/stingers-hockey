import "server-only";
import { after } from "next/server";
import { SITE_URL } from "@/lib/seo";

// ============================================================================
// IndexNow — beritahu enjin carian sebaik sesuatu berubah.
//
// KENAPA INI WUJUD. Kod lama memanggil `google.com/ping?sitemap=…` setiap hari.
// Google menamatkan endpoint itu pada Jun 2023; ia kini membalas HTTP 404
// (disahkan terhadap alamat kita sendiri). Jadi cron "SEO auto-boost" harian
// itu tidak pernah memberitahu sesiapa apa-apa — ia memanggil halaman ralat.
//
// IndexNow ialah protokol yang masih hidup dan percuma. Satu POST memberitahu
// Bing, Yandex, Naver, Seznam dan DuckDuckGo sekaligus. Google tidak menyertai
// IndexNow — bagi Google, jalan yang berkesan ialah sitemap yang jujur dengan
// <lastmod> sebenar, dan itu sudah dibetulkan di app/sitemap.ts.
//
// Pengesahan: kunci di bawah mesti boleh dicapai sebagai teks biasa di
//   https://hoki.my/<KUNCI>.txt
// Fail itu ada dalam public/. Kunci ini memang direka untuk jadi awam — ia
// hanya membuktikan bahawa sesiapa yang menghantar URL memiliki domain ini,
// jadi ia bukan rahsia dan tidak sepatutnya diletak dalam env.
// ============================================================================

const KUNCI = "aed6f963b390c9fdc2f4792b1f448ac2";
const LOKASI_KUNCI = `${SITE_URL}/${KUNCI}.txt`;
const HOS = new URL(SITE_URL).host;
const ENDPOINT = "https://api.indexnow.org/indexnow";

export type HasilIndexNow = {
  ok: boolean;
  /** Kod status HTTP sebenar dari IndexNow, atau null jika permintaan gagal. */
  status: number | null;
  /** Bilangan URL yang benar-benar dihantar selepas ditapis. */
  dihantar: number;
  nota: string;
};

/**
 * Hantar senarai URL yang BERUBAH kepada IndexNow.
 *
 * Hantar hanya yang benar-benar berubah. Menghantar keseluruhan laman setiap
 * hari ialah cara paling cepat untuk isyarat ini diabaikan.
 *
 * Fungsi ini tidak pernah melontar. Ia dipanggil dari laluan yang menerbitkan
 * berita, dan Bing yang tersekat tidak boleh menyebabkan jurulatih gagal
 * menyiarkan berita.
 */
export async function hantarIndexNow(urls: string[]): Promise<HasilIndexNow> {
  // Hanya alamat kita sendiri; IndexNow menolak keseluruhan kumpulan jika satu
  // URL berada di luar hos yang dituntut.
  const bersih = [...new Set(urls)]
    .filter((u) => {
      try {
        return new URL(u).host === HOS;
      } catch {
        return false;
      }
    })
    .slice(0, 10_000); // had protokol bagi satu penghantaran

  if (bersih.length === 0) {
    return { ok: true, status: null, dihantar: 0, nota: "Tiada URL untuk dihantar." };
  }

  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host: HOS,
        key: KUNCI,
        keyLocation: LOKASI_KUNCI,
        urlList: bersih,
      }),
      // Jangan biarkan permintaan ini menggantung penerbitan berita.
      signal: AbortSignal.timeout(10_000),
    });

    // 200 = diterima. 202 = diterima, kunci masih dalam giliran pengesahan.
    const ok = res.status === 200 || res.status === 202;
    return {
      ok,
      status: res.status,
      dihantar: bersih.length,
      nota: ok ? "Diterima IndexNow." : `IndexNow menolak (HTTP ${res.status}).`,
    };
  } catch (error) {
    // Diam-diam gagal untuk pemanggil, tetapi kekal kelihatan dalam log.
    console.error("[indexnow] penghantaran gagal:", error);
    return { ok: false, status: null, dihantar: 0, nota: `Permintaan gagal: ${String(error)}` };
  }
}

/**
 * Beritahu enjin carian tentang alamat ini SELEPAS balasan dihantar.
 *
 * Jurulatih yang menekan "Terbitkan" tidak sepatutnya menunggu Bing. `after()`
 * menjalankan kerja ini apabila balasan sudah pun sampai ke pelayar, jadi masa
 * bulat perjalanan IndexNow tidak pernah dirasai sesiapa. Tanpa ini, sesuatu
 * yang dilancarkan tanpa `await` akan dibunuh apabila fungsi tanpa pelayan
 * tamat.
 */
export function beritahuEnjinCarian(paths: string[]): void {
  const urls = paths.map((p) => (p.startsWith("http") ? p : `${SITE_URL}${p}`));
  after(async () => {
    const hasil = await hantarIndexNow(urls);
    console.log(
      `[indexnow] ${hasil.dihantar} url · HTTP ${hasil.status ?? "—"} · ${hasil.nota}`
    );
  });
}

/** Alamat fail kunci — digunakan oleh audit SEO untuk mengesahkan ia hidup. */
export const LOKASI_KUNCI_INDEXNOW = LOKASI_KUNCI;
