import "server-only";
import { cache } from "react";
import { createPublicSupabase } from "@/lib/supabase/public";

// ============================================================================
// Bacaan awam berita — dikongsi oleh sitemap, suapan RSS dan halaman senarai.
//
// Sebelum ini sitemap menyenaraikan tiga slug artikel yang ditulis tangan.
// Setiap artikel baharu yang ditulis jurulatih tidak pernah masuk sitemap,
// jadi enjin carian hanya menjumpainya jika ia kebetulan merangkak /berita.
// Di sini senarai itu datang terus dari pangkalan data, jadi ia tidak boleh
// jadi lapuk lagi.
// ============================================================================

export type NewsListItem = {
  id: string;
  slug: string;
  title: string;
  body: string | null;
  imageUrl: string | null;
  publishedAt: string;
  translations?: { en?: Record<string, string> } | null;
};

/**
 * Semua berita tersiar, terbaharu dahulu.
 *
 * `cache()` React menyatukan panggilan dalam satu render — halaman senarai dan
 * `generateMetadata`nya berkongsi satu bacaan DB, bukan dua.
 */
export const getAllNews = cache(async (): Promise<NewsListItem[]> => {
  const supabase = createPublicSupabase();
  const { data, error } = await supabase
    .from("news")
    .select("id, title, body, image_url, published_at, slug, translations")
    .order("published_at", { ascending: false });

  // DB senyap (projek dijeda, kunci diputar) tidak boleh meruntuhkan sitemap.
  // Lebih baik sitemap yang mengandungi halaman utama sahaja daripada 500.
  if (error || !data) return [];

  return data
    .filter((r): r is typeof r & { slug: string } => Boolean(r.slug))
    .map((r) => ({
      id: r.id as string,
      slug: r.slug,
      title: r.title as string,
      body: (r.body as string | null) ?? null,
      imageUrl: (r.image_url as string | null) ?? null,
      publishedAt: r.published_at as string,
      translations: (r as { translations?: NewsListItem["translations"] }).translations ?? null,
    }));
});
