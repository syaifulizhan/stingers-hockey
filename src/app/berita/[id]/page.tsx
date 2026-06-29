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

async function getNews(idOrSlug: string): Promise<NewsRow | null> {
  const supabase = createPublicSupabase();
  const cols = "id, title, body, image_url, image_urls, published_at";
  // Utama: cari ikut slug tajuk.
  const bySlug = await supabase.from("news").select(cols).eq("slug", idOrSlug).maybeSingle();
  if (bySlug.data) return bySlug.data as NewsRow;
  // Fallback: pautan lama yang guna UUID.
  if (UUID_RE.test(idOrSlug)) {
    const byId = await supabase.from("news").select(cols).eq("id", idOrSlug).maybeSingle();
    if (byId.data) return byId.data as NewsRow;
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
