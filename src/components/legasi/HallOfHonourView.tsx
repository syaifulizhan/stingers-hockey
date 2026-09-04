"use client";

import Link from "next/link";
import Reveal from "@/components/ui/Reveal";
import SmartImg from "@/components/SmartImg";
import { useLang } from "@/lib/i18n";
import { byCohort, type LegacyRecord } from "@/lib/legasi";

function KadLegasi({ r }: { r: LegacyRecord }) {
  const { t } = useLang();
  return (
    <Link
      href={`/legasi/${r.slug}`}
      className="group flex h-full w-full flex-col overflow-hidden rounded-2xl border border-line bg-bg-soft transition-colors hover:border-amber/60"
    >
      {r.heroImage ? (
        <SmartImg src={r.heroImage} alt={r.fullName} className="aspect-[3/4] w-full object-cover" />
      ) : (
        <div className="flex aspect-[3/4] w-full items-center justify-center bg-ink">
          <span className="font-sans text-xs uppercase tracking-widest text-muted">
            {t("Potret menyusul", "Portrait to come")}
          </span>
        </div>
      )}
      <div className="flex flex-1 flex-col p-5">
        {r.result && (
          <p className="font-sans text-xs font-semibold uppercase tracking-widest text-amber">
            ◆ {r.result}
          </p>
        )}
        <h3 className="display mt-2 text-2xl leading-tight text-paper">
          {r.nameFirst} {r.nameLast}
        </h3>
        {r.category && (
          <p className="mt-1 font-sans text-xs uppercase tracking-wider text-muted">{r.category}</p>
        )}
        <p className="mt-3 font-sans text-[11px] font-semibold uppercase tracking-wider text-amber-deep">
          {t("Rekod", "Record")} {r.recordNo}
        </p>
      </div>
    </Link>
  );
}

export default function HallOfHonourView({ records }: { records: LegacyRecord[] }) {
  const { t } = useLang();
  const kohort = byCohort(records);
  const tahunSeterusnya = (kohort[0]?.[0] ?? new Date().getFullYear()) + 1;

  return (
    <section className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <Reveal>
          <span className="font-sans text-sm font-semibold uppercase tracking-[0.3em] text-amber">
            {t("Rekod Kekal Pasukan", "Permanent Team Record")}
          </span>
        </Reveal>
        <Reveal delay={0.1}>
          <h1 className="display mt-5 text-5xl text-paper sm:text-7xl">
            Hall of Honour
          </h1>
        </Reveal>
        <Reveal delay={0.15}>
          <p className="mt-6 max-w-2xl font-sans text-base leading-relaxed text-muted">
            {t(
              "Mereka yang membawa nama Stingers keluar dari padang ini, akan kekal namanya di sini.",
              "Those who carried the Stingers name beyond this field. Their names stay here.",
            )}
          </p>
        </Reveal>

        {kohort.length === 0 ? (
          <Reveal delay={0.2}>
            <div className="mt-16 rounded-2xl border border-dashed border-line px-8 py-20 text-center">
              <p className="font-sans text-sm text-muted">
                {t(
                  "Dinding ini menunggu nama pertamanya.",
                  "This wall is waiting for its first name.",
                )}
              </p>
            </div>
          </Reveal>
        ) : (
          kohort.map(([tahun, senarai], ci) => (
            <div key={tahun} className="mt-16">
              <Reveal delay={0.1 + ci * 0.05}>
                <div className="flex items-center gap-6">
                  <span className="display text-4xl text-paper sm:text-5xl">{tahun}</span>
                  <span className="h-px flex-1 bg-line" />
                  <span className="font-sans text-xs font-semibold uppercase tracking-widest text-muted">
                    {senarai.length} {t("rekod", "records")}
                  </span>
                </div>
              </Reveal>
              <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {senarai.map((r, i) => (
                  <Reveal key={r.slug} delay={0.15 + i * 0.08}>
                    <KadLegasi r={r} />
                  </Reveal>
                ))}
              </div>
            </div>
          ))
        )}

        {kohort.length > 0 && (
          <Reveal delay={0.2}>
            <div className="mt-16">
              <div className="flex items-center gap-6">
                <span className="display text-4xl text-muted sm:text-5xl">{tahunSeterusnya}</span>
                <span className="h-px flex-1 bg-line" />
              </div>
              <div className="mt-8 rounded-2xl border border-dashed border-line px-8 py-14 text-center">
                <p className="font-sans text-sm text-muted">
                  {t(
                    "Dinding ini menunggu nama seterusnya.",
                    "This wall is waiting for the next name.",
                  )}
                </p>
              </div>
            </div>
          </Reveal>
        )}
      </div>
    </section>
  );
}
