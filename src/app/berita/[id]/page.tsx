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
  published_at: string;
};

async function getNews(id: string): Promise<NewsRow | null> {
  const supabase = createPublicSupabase();
  const { data } = await supabase
    .from("news")
    .select("id, title, body, image_url, published_at")
    .eq("id", id)
    .maybeSingle();
  return (data as NewsRow | null) ?? null;
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
