import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import BeritaArticle from "@/components/BeritaArticle";
import { createPublicSupabase } from "@/lib/supabase/public";

type NewsRow = {
  id: string;
  title: string;
  body: string | null;
  image_url: string | null;
  image_urls: string[] | null;
  published_at: string;
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
    .select("id, title, body, image_url, image_urls, published_at")
    .eq(field, value)
    .maybeSingle();
  if (full.data) return full.data as NewsRow;

  if (full.error) {
    const fallback = await supabase
      .from("news")
      .select("id, title, body, image_url, published_at")
      .eq(field, value)
      .maybeSingle();
    if (fallback.data) return { ...fallback.data, image_urls: null } as NewsRow;
  }
  return null;
}

async function getNews(idOrSlug: string): Promise<NewsRow | null> {
  const supabase = createPublicSupabase();
  // Utama: cari ikut slug tajuk.
  const bySlug = await queryNews(supabase, "slug", idOrSlug);
  if (bySlug) return bySlug;
  // Fallback: pautan lama yang guna UUID.
  if (UUID_RE.test(idOrSlug)) {
    return queryNews(supabase, "id", idOrSlug);
  }
  return null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const news = await getNews(id);
  if (!news) return { title: "Berita — Stingers Hockey" };
  return {
    title: `${news.title} — Stingers Hockey`,
    description: news.body?.slice(0, 150) ?? undefined,
    openGraph: {
      title: news.title,
      images: news.image_url ? [news.image_url] : undefined,
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

  return (
    <>
      <Navigation />
      <main className="flex-1">
        <BeritaArticle news={news} />
      </main>
      <Footer />
    </>
  );
}
