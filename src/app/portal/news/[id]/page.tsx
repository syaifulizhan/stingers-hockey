import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createServerSupabase } from "@/lib/supabase/server";

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
  const { data } = await supabase
    .from("news")
    .select("id, title, body, image_url, image_urls, published_at")
    .eq("id", id)
    .maybeSingle();

  const news = data as NewsRow | null;
  if (!news) notFound();

  const gallery: string[] =
    news.image_urls && news.image_urls.length > 0
      ? news.image_urls
      : news.image_url
        ? [news.image_url]
        : [];

  const [mainImage, ...extraImages] = gallery;

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

      {/* Gambar utama */}
      {mainImage && (
        // eslint-disable-next-line @next/next/no-img-element -- gambar dari Supabase Storage
        <img
          src={mainImage}
          alt={news.title}
          className="mt-6 w-full rounded-2xl border border-line object-cover"
        />
      )}

      {/* Isi berita */}
      {news.body && (
        <div className="mt-6 whitespace-pre-wrap font-sans text-base leading-relaxed text-paper/90">
          {news.body}
        </div>
      )}

      {/* Galeri gambar tambahan */}
      {extraImages.length > 0 && (
        <div className="mt-8">
          <p className="mb-3 font-sans text-xs font-semibold uppercase tracking-wider text-muted">
            Galeri
          </p>
          <div className="grid grid-cols-2 gap-3">
            {extraImages.map((src, i) => (
              // eslint-disable-next-line @next/next/no-img-element -- gambar dari Supabase Storage
              <img
                key={src}
                src={src}
                alt={`${news.title} — gambar ${i + 2}`}
                className="w-full rounded-xl border border-line object-cover aspect-video"
              />
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
