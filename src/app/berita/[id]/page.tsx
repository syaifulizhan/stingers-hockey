import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import BeritaArticle from "@/components/BeritaArticle";
import JsonLd from "@/components/JsonLd";
import { createPublicSupabase } from "@/lib/supabase/public";
import { canonical, ringkasan, SITE_NAME, SITE_URL, tajukHalaman } from "@/lib/seo";
import { breadcrumbs, graf } from "@/lib/jsonld";

type NewsRow = {
  id: string;
  title: string;
  body: string | null;
  image_url: string | null;
  image_urls: string[] | null;
  published_at: string;
  slug: string | null;
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function queryNews(
  supabase: ReturnType<typeof createPublicSupabase>,
  field: "slug" | "id",
  value: string
): Promise<NewsRow | null> {
  // Cuba dengan image_urls dahulu; jika kolum belum wujud dalam DB, cuba tanpa.
  const full = await supabase
    .from("news")
    .select("id, title, body, image_url, image_urls, published_at, slug")
    .eq(field, value)
    .maybeSingle();
  if (full.data) return full.data as NewsRow;

  if (full.error) {
    const fallback = await supabase
      .from("news")
      .select("id, title, body, image_url, published_at, slug")
      .eq(field, value)
      .maybeSingle();
    if (fallback.data) return { ...fallback.data, image_urls: null } as NewsRow;
  }
  return null;
}

// `cache()` menjadikan generateMetadata dan halaman berkongsi SATU bacaan DB.
// Tanpanya setiap lawatan artikel memukul Supabase dua kali untuk baris yang
// sama.
const getNews = cache(async (idOrSlug: string): Promise<NewsRow | null> => {
  const supabase = createPublicSupabase();
  // Utama: cari ikut slug tajuk.
  const bySlug = await queryNews(supabase, "slug", idOrSlug);
  if (bySlug) return bySlug;
  // Fallback: pautan lama yang guna UUID.
  if (UUID_RE.test(idOrSlug)) {
    return queryNews(supabase, "id", idOrSlug);
  }
  return null;
});

/**
 * Alamat kanonik artikel — sentiasa bentuk slug.
 *
 * Pautan lama berasaskan UUID masih berfungsi dan mesti kekal berfungsi, tetapi
 * kedua-dua alamat menyajikan artikel yang SAMA. Tanpa canonical, enjin carian
 * melihat dua halaman berkembar dan membahagi kredit antara keduanya. Ini
 * menunjukkan yang mana satu asal.
 */
function alamatArtikel(news: NewsRow): string {
  return canonical(`/berita/${news.slug ?? news.id}`);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const news = await getNews(id);
  if (!news) return { title: `Berita — ${SITE_NAME}`, robots: { index: false, follow: true } };

  const url = alamatArtikel(news);
  const perihal = ringkasan(news.body);

  // `images` SENGAJA tidak ditetapkan di sini. Menetapkannya menimpa kad yang
  // dijana oleh opengraph-image.tsx bersebelahan fail ini. Kad itu lebih baik
  // untuk perkongsian: ia membawa tajuk artikel sebagai teks di atas gambar,
  // dalam nisbah 1200×630 yang dijangka WhatsApp dan Facebook. Gambar Supabase
  // mentah selalunya potret dan dipotong dengan buruk pada kad kongsi.
  return {
    title: tajukHalaman(news.title),
    description: perihal,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      // siteName dan locale diulang di sini dengan sengaja: blok openGraph
      // halaman MENGGANTIKAN blok induk sepenuhnya, jadi apa yang tidak
      // dinyatakan di sini hilang terus dari <head>.
      siteName: SITE_NAME,
      locale: "ms_MY",
      title: news.title,
      description: perihal,
      url,
      publishedTime: news.published_at,
      authors: [SITE_NAME],
      section: "Hoki",
    },
    // Ditetapkan secara jelas. Tanpa ini, Twitter/X mewarisi tajuk peringkat
    // laman dari layout — jadi setiap artikel yang dikongsi terpapar sebagai
    // "Strike Hard. Strike Fast." dan bukan tajuk artikel sebenar.
    twitter: {
      card: "summary_large_image",
      title: news.title,
      description: perihal,
    },
  };
}

export default async function BeritaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const news = await getNews(id);
  if (!news) notFound();

  const url = alamatArtikel(news);
  const gambar = news.image_urls?.length
    ? news.image_urls
    : news.image_url
      ? [news.image_url]
      : [];

  // NewsArticle ialah jenis yang melayakkan artikel untuk karusel Berita
  // Teratas dan Google Discover — di situlah berita sekolah sebenarnya
  // dijumpai orang.
  const artikelSchema = {
    "@type": "NewsArticle",
    "@id": url,
    mainEntityOfPage: url,
    headline: news.title.slice(0, 110), // Google mengabaikan headline > 110 aksara
    description: ringkasan(news.body),
    datePublished: news.published_at,
    dateModified: news.published_at,
    inLanguage: "ms-MY",
    author: { "@id": `${SITE_URL}/#pasukan` },
    publisher: { "@id": `${SITE_URL}/#pasukan` },
    ...(gambar.length ? { image: gambar } : {}),
    ...(news.body ? { articleBody: news.body } : {}),
  };

  return (
    <>
      <JsonLd
        json={graf(
          // pasukanSchema tidak diulang di sini — layout sudah memancarkannya
          // dengan @id yang sama, dan artikel merujuknya melalui @id itu.
          artikelSchema,
          breadcrumbs([
            { nama: "Berita", laluan: "/berita" },
            { nama: news.title },
          ])
        )}
      />
      <Navigation />
      <main className="flex-1">
        <BeritaArticle news={news} />
      </main>
      <Footer />
    </>
  );
}
