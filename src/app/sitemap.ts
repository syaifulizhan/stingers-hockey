import type { MetadataRoute } from "next";
import { canonical } from "@/lib/seo";
import { getAllNews } from "@/lib/news-data";
import { getPublishedRecords } from "@/lib/legasi-data";

// ============================================================================
// Sitemap — dijana dari pangkalan data, bukan ditulis tangan.
//
// Dua peraturan yang dilanggar oleh versi sebelum ini:
//
//   1. Hanya senaraikan alamat yang boleh diindeks. /hustle-gear ialah
//      redirect ke /tempahan dan /launching membawa noindex. Menyenaraikan
//      keduanya menyuruh perangkak membazir lawatan pada halaman yang tidak
//      akan pernah muncul dalam hasil carian.
//
//   2. <lastmod> mesti bercakap benar. Dahulu setiap alamat membawa
//      `new Date()`, jadi setiap kali sitemap dibaca ia mengaku SEMUA halaman
//      baru berubah. Bila lastmod terbukti tipu, Google berhenti mempercayainya
//      dan sitemap hilang gunanya sebagai isyarat kesegaran.
// ============================================================================

// Sitemap dibina semula setiap jam. Cukup segar untuk berita, dan tidak
// memukul Supabase pada setiap lawatan perangkak.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [news, legasi] = await Promise.all([getAllNews(), getPublishedRecords()]);

  // Berita terbaharu ialah bukti laman ini hidup — ia menetapkan kesegaran
  // halaman utama dan arkib berita.
  const beritaTerbaharu = news[0]?.publishedAt ? new Date(news[0].publishedAt) : new Date();
  const legasiTerbaharu = legasi
    .map((r) => r.publishedAt)
    .filter((d): d is string => Boolean(d))
    .sort()
    .at(-1);

  const halamanUtama: MetadataRoute.Sitemap = [
    {
      url: canonical("/"),
      lastModified: beritaTerbaharu,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: canonical("/berita"),
      lastModified: beritaTerbaharu,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: canonical("/legasi"),
      lastModified: legasiTerbaharu ? new Date(legasiTerbaharu) : beritaTerbaharu,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: canonical("/live"),
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: canonical("/keputusan"),
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: canonical("/tempahan"),
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
  ];

  // Setiap artikel, dengan tarikh terbit sebenar sebagai lastmod. Gambar utama
  // disertakan supaya artikel layak muncul dalam Google Images juga.
  const artikel: MetadataRoute.Sitemap = news.map((n) => ({
    url: canonical(`/berita/${n.slug}`),
    lastModified: new Date(n.publishedAt),
    changeFrequency: "monthly",
    priority: 0.7,
    ...(n.imageUrl ? { images: [n.imageUrl] } : {}),
  }));

  // Hall of Honour — setiap profil ialah halaman tersendiri dengan nama penuh
  // pemain. Inilah kata kunci yang orang betul-betul cari.
  const profil: MetadataRoute.Sitemap = legasi.map((r) => ({
    url: canonical(`/legasi/${r.slug}`),
    lastModified: r.publishedAt ? new Date(r.publishedAt) : new Date(),
    changeFrequency: "yearly",
    priority: 0.8,
    ...(r.heroImage ? { images: [r.heroImage] } : {}),
  }));

  return [...halamanUtama, ...artikel, ...profil];
}
