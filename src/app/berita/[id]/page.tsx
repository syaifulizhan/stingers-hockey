import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
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
        <article className="mx-auto max-w-2xl px-6 pt-32 pb-20 sm:pt-40">
          <Link
            href="/#berita"
            className="inline-flex items-center gap-1.5 font-sans text-sm text-muted transition-colors hover:text-amber"
          >
            <ArrowLeft className="h-4 w-4" /> Semua berita
          </Link>

          <h1 className="display mt-6 text-4xl leading-tight text-paper sm:text-5xl">
            {news.title}
          </h1>
          <p className="mt-3 font-sans text-sm text-muted">
            {new Date(news.published_at).toLocaleDateString("ms-MY", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>

          {news.image_url && (
            // eslint-disable-next-line @next/next/no-img-element -- gambar dari Supabase Storage
            <img
              src={news.image_url}
              alt={news.title}
              className="mt-6 w-full rounded-2xl border border-line object-cover"
            />
          )}

          {news.body && (
            <div className="mt-6 whitespace-pre-wrap font-sans text-base leading-relaxed text-paper/90">
              {news.body}
            </div>
          )}
        </article>
      </main>
      <Footer />
    </>
  );
}
