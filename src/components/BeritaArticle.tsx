"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useLang } from "@/lib/i18n";
import ShareButton from "@/components/ShareButton";

type NewsRow = {
  id: string;
  title: string;
  body: string | null;
  image_url: string | null;
  image_urls: string[] | null;
  published_at: string;
};

export default function BeritaArticle({ news }: { news: NewsRow }) {
  const { lang, t } = useLang();
  const locale = lang === "en" ? "en-MY" : "ms-MY";

  // Gunakan image_urls jika ada, fallback ke image_url sahaja.
  const gallery: string[] =
    news.image_urls && news.image_urls.length > 0
      ? news.image_urls
      : news.image_url
        ? [news.image_url]
        : [];

  const [mainImage, ...extraImages] = gallery;

  return (
    <article className="mx-auto max-w-2xl px-6 pt-32 pb-20 sm:pt-40">
      <Link
        href="/berita"
        className="inline-flex items-center gap-1.5 font-sans text-sm text-muted transition-colors hover:text-amber"
      >
        <ArrowLeft className="h-4 w-4" /> {t("Semua berita", "All news")}
      </Link>

      <h1 className="display mt-6 text-4xl leading-tight text-paper sm:text-5xl">
        {news.title}
      </h1>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <p className="font-sans text-sm text-muted">
          {new Date(news.published_at).toLocaleDateString(locale, {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
        <ShareButton title={news.title} />
      </div>

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
            {t("Galeri", "Gallery")}
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
