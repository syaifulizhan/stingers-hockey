"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useLang } from "@/lib/i18n";
import SmartImg from "@/components/SmartImg";

type NewsRow = {
  id: string;
  title: string;
  body: string | null;
  image_url: string | null;
  published_at: string;
  slug: string | null;
};

export default function BeritaArchiveView({ news }: { news: NewsRow[] }) {
  const { lang, t } = useLang();
  const locale = lang === "en" ? "en-MY" : "ms-MY";

  return (
    <section className="mx-auto max-w-7xl px-6 pt-32 pb-24 sm:pt-40">
      <Link
        href="/#berita"
        className="inline-flex items-center gap-1.5 font-sans text-sm text-muted transition-colors hover:text-amber"
      >
        <ArrowLeft className="h-4 w-4" /> {t("Kembali ke laman utama", "Back to home")}
      </Link>

      <div className="mt-8">
        <span className="font-sans text-sm font-semibold uppercase tracking-[0.3em] text-amber">
          {t("Arkib Berita", "News Archive")}
        </span>
        <h1 className="display mt-3 text-5xl text-paper sm:text-6xl">
          {t("Semua", "All")} <span className="text-amber">{t("Berita", "News")}</span>
        </h1>
        <p className="mt-4 font-sans text-base text-muted">
          {t(
            `${news.length} berita keseluruhan`,
            `${news.length} articles total`
          )}
        </p>
      </div>

      {news.length === 0 ? (
        <p className="mt-16 font-sans text-base text-muted">
          {t("Tiada berita buat masa ini.", "No news at the moment.")}
        </p>
      ) : (
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {news.map((n) => (
            <Link
              key={n.id}
              href={`/berita/${n.slug ?? n.id}`}
              className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-bg-soft transition-colors hover:border-amber/60"
            >
              {n.image_url ? (
                <SmartImg
                  src={n.image_url}
                  alt={n.title}
                  className="aspect-video w-full object-cover"
                />
              ) : (
                <div className="aspect-video w-full bg-ink" />
              )}
              <div className="flex flex-1 flex-col p-6">
                <p className="font-sans text-xs uppercase tracking-wider text-muted">
                  {new Date(n.published_at).toLocaleDateString(locale, {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
                <h2 className="mt-2 font-sans text-lg font-semibold text-paper">
                  {n.title}
                </h2>
                {n.body && (
                  <p className="mt-2 line-clamp-2 font-sans text-sm text-muted">
                    {n.body}
                  </p>
                )}
                <span className="mt-4 font-sans text-sm font-semibold text-amber">
                  {t("Baca lagi →", "Read more →")}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
