"use client";

import Link from "next/link";
import Reveal from "@/components/ui/Reveal";
import SmartImg from "@/components/SmartImg";
import DragMarquee from "@/components/ui/DragMarquee";
import { useLang } from "@/lib/i18n";
import ShareButton from "@/components/ShareButton";
import { legacyUrl, type LegacyRecord } from "@/lib/legasi";
import { waybackUrl } from "@/lib/legasi-arkib-url";

export default function ProfilLegasiView({
  r,
  /** Skrin pratonton portal — rekod mungkin masih draf, jadi jangan tawar kongsi. */
  preview = false,
}: {
  r: LegacyRecord;
  preview?: boolean;
}) {
  const { lang, t } = useLang();
  const locale = lang === "en" ? "en-MY" : "ms-MY";

  // Tajuk perkongsian membawa pencapaian, bukan sekadar nama — itu yang
  // bermakna apabila pautan muncul dalam sembang keluarga.
  const tajukKongsi = [r.fullName, r.result, r.event].filter(Boolean).join(" · ");

  const gambar = r.photos.slice(0, 7);
  const kad = [r.cardFront, r.cardBack].filter(Boolean) as string[];

  const keping = gambar.map((src, i) => (
    <div
      key={i}
      className="w-[220px] shrink-0 overflow-hidden rounded-xl border border-line bg-bg-soft sm:w-[260px]"
    >
      <SmartImg
        src={src}
        alt={`${r.fullName} — ${i + 1}`}
        draggable={false}
        className="aspect-[3/4] w-full object-cover"
      />
    </div>
  ));

  return (
    <article>
      {/* ── Hero ───────────────────────────────────────────── */}
      <section className="border-b border-line bg-bg-soft">
        <div className="mx-auto max-w-7xl px-6 py-16 sm:py-20">
          <Link
            href="/legasi"
            className="font-sans text-xs font-semibold uppercase tracking-widest text-amber transition-opacity hover:opacity-70"
          >
            ← Hall of Honour
          </Link>

          <div className="mt-10 flex flex-col gap-12 lg:flex-row lg:items-center lg:gap-16">
            <div className="flex-1">
              <Reveal>
                {r.result && (
                  <p className="font-sans text-sm font-semibold uppercase tracking-[0.3em] text-amber">
                    ◆ {r.result}
                    {r.event ? ` · ${r.event}` : ""}
                  </p>
                )}
              </Reveal>
              <Reveal delay={0.08}>
                <h1 className="display mt-5 text-4xl leading-[1.05] text-muted sm:text-5xl">
                  {r.nameFirst}
                </h1>
              </Reveal>
              <Reveal delay={0.12}>
                <p className="display text-6xl leading-[1.02] text-paper sm:text-8xl">
                  {r.nameLast}
                </p>
              </Reveal>
              <Reveal delay={0.16}>
                <span className="mt-6 block h-[3px] w-32 bg-amber" />
              </Reveal>
              <Reveal delay={0.2}>
                <p className="mt-6 font-sans text-sm uppercase tracking-wider text-muted">
                  {[r.category, r.school].filter(Boolean).join("  ·  ")}
                </p>
                <p className="mt-2 font-sans text-xs font-semibold uppercase tracking-wider text-amber-deep">
                  {t("Rekod", "Record")} {r.recordNo}
                </p>
              </Reveal>
              {!preview && (
                <Reveal delay={0.24}>
                  <div className="mt-7">
                    <ShareButton
                      title={tajukKongsi}
                      heading={t("Kongsi rekod ini", "Share this record")}
                      // Alamat kanonik, bukan URL semasa — supaya pautan yang
                      // dikongsi sentiasa alamat kekal yang dicetak pada kad.
                      url={legacyUrl(r.slug)}
                    />
                  </div>
                </Reveal>
              )}
            </div>

            {r.heroImage && (
              <Reveal delay={0.12}>
                <div className="w-full overflow-hidden rounded-2xl border border-line lg:w-[420px]">
                  <SmartImg
                    src={r.heroImage}
                    alt={r.fullName}
                    className="aspect-[3/4] w-full object-cover"
                  />
                </div>
              </Reveal>
            )}
          </div>
        </div>
      </section>

      {/* ── Cerita + perjalanan ────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="flex flex-col gap-16 lg:flex-row">
          <div className="flex-1">
            {r.story && (
              <Reveal>
                <h2 className="display text-3xl text-paper">
                  {t("Jalan Ke Sana", "The Road There")}
                </h2>
                <div className="mt-5 space-y-4">
                  {r.story.split(/\n\s*\n/).map((para, i) => (
                    <p key={i} className="font-sans text-base leading-relaxed text-muted">
                      {para}
                    </p>
                  ))}
                </div>
              </Reveal>
            )}

            {r.quoteText && (
              <Reveal delay={0.1}>
                <blockquote className="mt-10 border-l-[3px] border-amber pl-6">
                  <p className="font-sans text-lg leading-relaxed text-paper">{r.quoteText}</p>
                  {r.quoteBy && (
                    <footer className="mt-3 font-sans text-sm text-muted">— {r.quoteBy}</footer>
                  )}
                </blockquote>
              </Reveal>
            )}
          </div>

          <div className="w-full lg:w-[400px]">
            {r.journey.length > 0 && (
              <Reveal delay={0.1}>
                <h2 className="font-sans text-sm font-semibold uppercase tracking-[0.3em] text-amber">
                  {t("Perjalanan", "The Journey")}
                </h2>
                <ul className="mt-4">
                  {r.journey.map((s, i) => (
                    <li key={i} className="flex gap-5 border-t border-line py-4">
                      <span
                        className={`font-sans text-sm font-semibold tracking-wider ${
                          s.peak ? "text-amber" : "text-muted"
                        }`}
                      >
                        {s.year}
                      </span>
                      <span
                        className={`font-sans text-sm leading-relaxed ${
                          s.peak ? "text-paper" : "text-muted"
                        }`}
                      >
                        {s.what}
                      </span>
                    </li>
                  ))}
                </ul>
              </Reveal>
            )}

            {kad.length > 0 && (
              <Reveal delay={0.15}>
                <div className="mt-10">
                  <h2 className="font-sans text-sm font-semibold uppercase tracking-[0.3em] text-amber">
                    {t("Kad Fizikal", "The Physical Card")}
                  </h2>
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    {kad.map((src, i) => (
                      <div key={i} className="overflow-hidden rounded-xl border border-line">
                        <SmartImg
                          src={src}
                          alt={i === 0 ? t("Kad depan", "Card front") : t("Kad belakang", "Card back")}
                          className="aspect-[54/86] w-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </Reveal>
            )}
          </div>
        </div>
      </section>

      {/* ── Jalur gambar ───────────────────────────────────── */}
      {keping.length > 0 && (
        <section className="border-t border-line py-16">
          <div className="mx-auto max-w-7xl px-6">
            <h2 className="font-sans text-sm font-semibold uppercase tracking-[0.3em] text-amber">
              {t("Album", "Album")}
            </h2>
          </div>
          <Reveal delay={0.1}>
            <DragMarquee
              items={keping}
              speed={18}
              gap={16}
              className="mt-8"
              label={t("Jalur gambar", "Photo strip")}
            />
          </Reveal>
        </section>
      )}

      {/* ── Petikan rekod ──────────────────────────────────── */}
      <footer className="border-t border-line bg-bg-soft">
        <div className="mx-auto max-w-7xl px-6 py-14">
          <p className="font-sans text-sm font-semibold uppercase tracking-widest text-amber">
            hoki.my/legasi/{r.slug}
          </p>
          <p className="mt-3 font-sans text-xs uppercase tracking-wider text-muted">
            {t("Rekod", "Record")} {r.recordNo}
            {r.publishedAt
              ? ` · ${t("Direkodkan", "Recorded")} ${new Date(r.publishedAt).toLocaleDateString(
                  locale,
                  { day: "numeric", month: "long", year: "numeric" },
                )}`
              : ""}
            {" · "}
            {t("Hall of Honour Stingers Hockey", "Stingers Hockey Hall of Honour")}
          </p>

          {/* Rekod ini hidup: ia dikemas kini bila perjalanan pemain berkembang,
              dan setiap versi yang pernah tersiar disimpan selamanya. */}
          {r.revisions.length > 1 && (
            <details className="mt-5 max-w-3xl">
              <summary className="cursor-pointer font-sans text-xs uppercase tracking-wider text-amber-deep transition-colors hover:text-amber">
                {t(
                  `Rekod ini dikemas kini ${r.revisions.length - 1} kali`,
                  `This record has been updated ${r.revisions.length - 1} times`,
                )}
              </summary>
              <ul className="mt-3 border-t border-line">
                {r.revisions.map((v) => (
                  <li
                    key={v.versionNo}
                    className="flex items-baseline justify-between gap-4 border-b border-line py-2"
                  >
                    <span className="font-sans text-xs text-muted">
                      {t("Versi", "Version")} {v.versionNo}
                      {v.versionNo === 1 ? ` · ${t("asal", "original")}` : ""}
                    </span>
                    <span className="font-sans text-xs text-muted/70">
                      {new Date(v.capturedAt).toLocaleDateString(locale, {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 font-sans text-xs leading-relaxed text-muted/70">
                {t(
                  "Setiap versi yang pernah tersiar disimpan selamanya. Rekod ini boleh berkembang — bila pemain ini mencapai lebih tinggi, kad yang sama akan membawa cerita yang lebih besar.",
                  "Every published version is kept forever. This record can grow — when this player reaches further, the same card will carry a bigger story.",
                )}
              </p>
            </details>
          )}
          <p className="mt-4 max-w-3xl font-sans text-sm leading-relaxed text-muted">
            {t(
              "Alamat ini dicetak pada kad fizikal dan tidak akan berubah.",
              "This address is printed on the physical card and will not change.",
            )}{" "}
            <a
              href={r.archiveUrl ?? waybackUrl(r.slug)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-deep underline-offset-2 transition-colors hover:text-amber hover:underline"
            >
              {t("Salinan arkib", "Archive copy")}
            </a>
            {r.archivedAt
              ? ` · ${t("diarkib", "archived")} ${new Date(r.archivedAt).toLocaleDateString(locale, {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}`
              : ""}
          </p>
        </div>
      </footer>
    </article>
  );
}
