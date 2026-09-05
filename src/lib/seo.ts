// ============================================================================
// SEO — satu sumber kebenaran untuk alamat kanonik dan teks ringkasan.
//
// Sebelum ini setiap halaman menulis "https://hoki.my" sendiri, dan
// kebanyakannya langsung tidak mengeluarkan <link rel="canonical">. Bila dua
// alamat menyajikan kandungan yang sama (hoki.my dan domain .vercel.app,
// atau URL dengan ?utm_source=), enjin carian membahagikan kredit antara
// keduanya. Canonical menyatukan kredit itu ke satu alamat.
// ============================================================================

export const SITE_URL = "https://hoki.my";
export const SITE_NAME = "Stingers Hockey";

/** Alamat penuh bagi satu laluan. Terima "/berita" atau "berita". */
export function canonical(path = "/"): string {
  if (!path.startsWith("/")) path = `/${path}`;
  return path === "/" ? SITE_URL : `${SITE_URL}${path}`;
}

/**
 * Ringkasan meta yang berhenti pada sempadan perkataan.
 *
 * Kaedah lama (`body.slice(0, 150)`) memotong di tengah perkataan — cuplikan
 * artikel di Google berbunyi "…mewakili daerah ke K". Google memaparkan lebih
 * kurang 155 aksara, jadi kita potong pada perkataan penuh sebelum had itu.
 */
export function ringkasan(text: string | null | undefined, max = 155): string | undefined {
  if (!text) return undefined;
  const bersih = text.replace(/\s+/g, " ").trim();
  if (!bersih) return undefined;
  if (bersih.length <= max) return bersih;
  const potong = bersih.slice(0, max);
  const ruang = potong.lastIndexOf(" ");
  return `${(ruang > 40 ? potong.slice(0, ruang) : potong).replace(/[,;:.\-–—]$/, "")}…`;
}

/**
 * Tajuk halaman dengan jenama dilampirkan HANYA jika ada ruang.
 *
 * Google memaparkan sekitar 60 aksara. Tajuk artikel berita selalunya sudah
 * mencecah had itu sendiri, jadi melampirkan " — Stingers Hockey" tidak
 * menambah jenama pada apa yang dilihat orang — ia hanya menolak hujung tajuk
 * keluar dari paparan. Bila tajuk sudah panjang, tajuk sahaja lebih baik.
 */
export function tajukHalaman(tajuk: string): string {
  const penuh = `${tajuk} — ${SITE_NAME}`;
  return penuh.length <= 65 ? penuh : tajuk;
}

/**
 * Blok Open Graph bagi satu halaman, dengan medan laman yang dikongsi.
 *
 * PERANGKAP YANG DIELAKKAN OLEH FUNGSI INI. Apabila sesuatu halaman
 * mengeksport `openGraph` sendiri, Next MENGGANTIKAN blok openGraph induk —
 * ia tidak menggabungkannya medan demi medan. Jadi halaman yang menetapkan
 * hanya tajuk dan URL secara senyap kehilangan og:site_name dan og:locale
 * daripada layout. Disahkan pada laman ini: /berita mengeluarkan empat tag og,
 * manakala / mengeluarkan sebelas.
 *
 * Setiap seksyen juga memerlukan opengraph-image.tsx sendiri; gambar
 * konvensyen-fail melekat pada segmen tempat ia berada dan tidak disuntik
 * semula ke dalam blok openGraph yang ditulis anaknya.
 */
export function ogHalaman(o: {
  title: string;
  description: string;
  path: string;
}) {
  return {
    type: "website" as const,
    siteName: SITE_NAME,
    locale: "ms_MY",
    title: o.title,
    description: o.description,
    url: canonical(o.path),
  };
}
