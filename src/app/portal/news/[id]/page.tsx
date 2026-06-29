import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createServerSupabase } from "@/lib/supabase/server";
import NewsImageCarousel from "@/components/NewsImageCarousel";

type NewsRow = {
  id: string;
  title: string;
  body: string | null;
  image_url: string | null;
  image_urls: string[] | null;
  published_at: string;
};

export default async function NewsDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerSupabase();

  let result = await supabase
    .from("news")
    .select("id, title, body, image_url, image_urls, published_at")
    .eq("id", id)
    .maybeSingle();

  // Jika kolum image_urls belum wujud dalam DB, cuba tanpa.
  if (result.error) {
    result = await supabase
      .from("news")
      .select("id, title, body, image_url, published_at")
      .eq("id", id)
      .maybeSingle();
  }

  const news = result.data ? { image_urls: null, ...result.data } as NewsRow : null;
  if (!news) notFound();

  const gallery: string[] =
    news.image_urls && news.image_urls.length > 0
      ? news.image_urls
      : news.image_url
        ? [news.image_url]
        : [];

  return (
    <article className="mx-auto max-w-2xl px-6 py-10">
      <Link
        href="/portal/news"
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

      <NewsImageCarousel images={gallery} title={news.title} />

      {news.body && (
        <div className="mt-6 whitespace-pre-wrap font-sans text-base leading-relaxed text-paper/90">
          {news.body}
        </div>
      )}
    </article>
  );
}
