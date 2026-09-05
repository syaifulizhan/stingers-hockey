import "server-only";
import { canonical, SITE_URL } from "@/lib/seo";
import { getAllNews } from "@/lib/news-data";
import { getPublishedRecords } from "@/lib/legasi-data";
import { LOKASI_KUNCI_INDEXNOW } from "@/lib/indexnow";

// ============================================================================
// Audit SEO — memeriksa laman HIDUP dan melaporkan apa yang didapatinya.
//
// APA YANG DIGANTIKAN. /api/seo/monitor dahulunya memulangkan tatasusunan
// bernama `mockRankings`: "hoki" pada kedudukan 15, "hoki malaysia" pada 5,
// semuanya "improving". Nombor-nombor itu ditulis tangan ke dalam kod. Tiada
// apa yang pernah mengukurnya. Ia kemudian mengira "skor kesihatan SEO"
// daripada nombor rekaan itu, dan melaporkan indexed: 10, errors: 0 — juga
// malar yang ditaip.
//
// Kedudukan kata kunci sebenar memerlukan Google Search Console API, yang
// memerlukan OAuth. Ia BUKAN sesuatu yang boleh dipalsukan dengan jujur. Jadi
// modul ini mengukur perkara yang benar-benar boleh diukurnya dari pelayan,
// dan berdiam diri tentang yang selebihnya:
//
//   • Adakah setiap alamat memulangkan 200?
//   • Adakah setiap satu membawa canonical, tajuk dan perihal?
//   • Adakah panjang tajuk/perihal berada dalam julat yang dipaparkan Google?
//   • Adakah setiap satu membawa JSON-LD yang boleh dihuraikan?
//   • Adakah sitemap, robots, RSS dan kunci IndexNow masih hidup?
//
// Diasingkan daripada route supaya cron harian boleh menjalankannya juga —
// pemeriksaan yang hanya berjalan bila seseorang teringat untuk memanggilnya
// ialah pemeriksaan yang tidak berjalan.
// ============================================================================

type Semakan = {
  url: string;
  status: number | null;
  canonical: string | null;
  canonicalPadan: boolean;
  panjangTajuk: number;
  panjangPerihal: number;
  blokJsonLd: number;
  jsonLdSah: boolean;
  masalah: string[];
};

function ambilTag(html: string, re: RegExp): string | null {
  return html.match(re)?.[1]?.trim() ?? null;
}

async function periksa(url: string): Promise<Semakan> {
  const masalah: string[] = [];
  let status: number | null = null;
  let html = "";

  try {
    const res = await fetch(url, {
      redirect: "follow",
      headers: {
        // Minta sebagai Googlebot: Next melangkau penstriman metadata untuk
        // perangkak, jadi ini melihat <head> yang SAMA seperti yang dilihat
        // Google — bukan versi yang metadatanya tiba kemudian.
        "User-Agent":
          "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
      },
      signal: AbortSignal.timeout(15_000),
    });
    status = res.status;
    html = await res.text();
  } catch (e) {
    return {
      url,
      status: null,
      canonical: null,
      canonicalPadan: false,
      panjangTajuk: 0,
      panjangPerihal: 0,
      blokJsonLd: 0,
      jsonLdSah: false,
      masalah: [`Tidak dapat dicapai: ${String(e)}`],
    };
  }

  if (status !== 200) masalah.push(`Status HTTP ${status}, sepatutnya 200.`);

  const tajuk = ambilTag(html, /<title[^>]*>([\s\S]*?)<\/title>/i) ?? "";
  const perihal = ambilTag(html, /<meta\s+name="description"\s+content="([^"]*)"/i) ?? "";
  const kanonik = ambilTag(html, /<link\s+rel="canonical"\s+href="([^"]*)"/i);

  if (!tajuk) masalah.push("Tiada <title>.");
  else if (tajuk.length > 65) masalah.push(`Tajuk ${tajuk.length} aksara — Google memotong sekitar 60.`);
  else if (tajuk.length < 20) masalah.push(`Tajuk hanya ${tajuk.length} aksara — terlalu nipis.`);

  if (!perihal) masalah.push("Tiada meta description.");
  else if (perihal.length > 165) masalah.push(`Perihal ${perihal.length} aksara — Google memotong sekitar 155.`);
  else if (perihal.length < 70) masalah.push(`Perihal hanya ${perihal.length} aksara — ruang cuplikan terbuang.`);

  if (!kanonik) masalah.push("Tiada <link rel=canonical>.");

  // Bandingkan tanpa slash penamat supaya "/berita" dan "/berita/" tidak
  // dilaporkan sebagai tidak sepadan.
  const norm = (u: string) => u.replace(/\/+$/, "");
  const canonicalPadan = Boolean(kanonik && norm(kanonik) === norm(url));
  if (kanonik && !canonicalPadan) {
    masalah.push(`Canonical menunjuk ke ${kanonik}, bukan ke alamat ini.`);
  }

  const blok = [...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)];
  let jsonLdSah = blok.length > 0;
  for (const b of blok) {
    try {
      JSON.parse(b[1]);
    } catch {
      jsonLdSah = false;
      masalah.push("Blok JSON-LD tidak boleh dihurai.");
    }
  }
  if (blok.length === 0) masalah.push("Tiada JSON-LD.");

  return {
    url,
    status,
    canonical: kanonik,
    canonicalPadan,
    panjangTajuk: tajuk.length,
    panjangPerihal: perihal.length,
    blokJsonLd: blok.length,
    jsonLdSah,
    masalah,
  };
}

export async function jalankanAudit() {
  const [news, legasi] = await Promise.all([getAllNews(), getPublishedRecords()]);

  // Sampel, bukan semuanya: halaman utama, dan artikel/profil terbaharu.
  // Memeriksa setiap halaman pada setiap larian akan melebihi had masa fungsi
  // sebaik sahaja arkib berita berkembang.
  const sampel = [
    canonical("/"),
    canonical("/berita"),
    canonical("/legasi"),
    canonical("/live"),
    canonical("/keputusan"),
    canonical("/tempahan"),
    ...news.slice(0, 3).map((n) => canonical(`/berita/${n.slug}`)),
    ...legasi.slice(0, 2).map((r) => canonical(`/legasi/${r.slug}`)),
  ];

  const semakan = await Promise.all(sampel.map(periksa));

  // Infrastruktur: sitemap, robots, suapan dan kunci IndexNow benar-benar hidup?
  const infraUrls = [
    canonical("/sitemap.xml"),
    canonical("/robots.txt"),
    canonical("/berita/rss.xml"),
    LOKASI_KUNCI_INDEXNOW,
  ];
  const infra = await Promise.all(
    infraUrls.map(async (u) => {
      try {
        const r = await fetch(u, { signal: AbortSignal.timeout(10_000) });
        return { url: u, status: r.status, ok: r.ok };
      } catch (e) {
        return { url: u, status: null, ok: false, ralat: String(e) };
      }
    })
  );

  const berMasalah = semakan.filter((s) => s.masalah.length > 0);

  return {
    ok: berMasalah.length === 0 && infra.every((i) => i.ok),
    pada: new Date().toISOString(),
    domain: new URL(SITE_URL).host,
    ringkasan: {
      halamanDiperiksa: semakan.length,
      halamanBersih: semakan.length - berMasalah.length,
      halamanBerMasalah: berMasalah.length,
      jumlahMasalah: semakan.reduce((n, s) => n + s.masalah.length, 0),
      artikelTersiar: news.length,
      rekodLegasiTersiar: legasi.length,
    },
    infrastruktur: infra,
    // Hanya halaman yang benar-benar mempunyai sesuatu yang salah — supaya
    // laporan ini boleh dibaca sekilas dan tidak dipenuhi tanda ✓.
    masalah: berMasalah.map((s) => ({ url: s.url, status: s.status, masalah: s.masalah })),
    semuaSemakan: semakan,
    nota:
      "Kedudukan kata kunci tidak dilaporkan di sini kerana ia tidak boleh diukur dari pelayan ini. " +
      "Gunakan Google Search Console (percuma) untuk kedudukan sebenar, tera dan klik.",
  };
}
