"use client";

import Link from "next/link";
import Reveal from "@/components/ui/Reveal";
import DragMarquee from "@/components/ui/DragMarquee";
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

export default function BeritaView({ news }: { news: NewsRow[] }) {
  const { lang, t } = useLang();
  const locale = lang === "en" ? "en-MY" : "ms-MY";

  const cards = news.map((n) => (
    <Link
      key={n.id}
      href={`/berita/${n.slug ?? n.id}`}
      draggable={false}
      className="group flex h-full w-[220px] shrink-0 flex-col overflow-hidden rounded-xl border border-line bg-bg-soft transition-colors hover:border-amber/60 sm:w-[240px]"
    >
      {n.image_url ? (
        <SmartImg
          src={n.image_url}
          alt={n.title}
          draggable={false}
          className="aspect-video w-full object-cover"
        />
      ) : (
        <div className="aspect-video w-full bg-ink" />
      )}
      <div className="flex flex-1 flex-col p-4">
        <p className="font-sans text-[11px] uppercase tracking-wider text-muted">
          {new Date(n.published_at).toLocaleDateString(locale, {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
        <h3 className="mt-1.5 line-clamp-2 font-sans text-sm font-semibold leading-snug text-paper">
          {n.title}
        </h3>
        {n.body && (
          <p className="mt-1.5 line-clamp-2 font-sans text-xs leading-relaxed text-muted">
            {n.body}
          </p>
        )}
        <span className="mt-3 font-sans text-xs font-semibold text-amber">
          {t("Baca lagi →", "Read more →")}
        </span>
      </div>
    </Link>
  ));

  return (
    <section id="berita" className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <Reveal>
          <span className="font-sans text-sm font-semibold uppercase tracking-[0.3em] text-amber">
            {t("Berita Terkini", "Latest News")}
          </span>
        </Reveal>
        <Reveal delay={0.1}>
          <h2 className="display mt-5 text-5xl text-paper sm:text-6xl">
            {t("Apa Yang", "What's")} <span className="text-amber">{t("Terjadi", "Happening")}</span>
          </h2>
        </Reveal>
      </div>

      {/* Jalur berita: hanyut perlahan, henti bila disentuh, boleh ditarik. */}
      <Reveal delay={0.15}>
        <DragMarquee
          items={cards}
          speed={22}
          gap={16}
          className="mt-10"
          label={t("Jalur berita terkini", "Latest news strip")}
        />
      </Reveal>

      <div className="mx-auto max-w-7xl px-6">
        <Reveal delay={0.3}>
          <div className="mt-10 text-center">
            <Link
              href="/berita"
              className="inline-block rounded-full border border-amber px-7 py-3 font-sans text-sm font-semibold uppercase tracking-wider text-amber transition-colors hover:bg-amber hover:text-ink"
            >
              {t("Lihat Semua Berita →", "View All News →")}
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
