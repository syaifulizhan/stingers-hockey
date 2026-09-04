"use client";

import Link from "next/link";
import { useLang } from "@/lib/i18n";
import type { LegacyRecord } from "@/lib/legasi";

// Halaman ini SENGAJA memulangkan 200, bukan 404.
//
// Sebabnya bukan teknikal, ia manusiawi: seseorang yang mengimbas QR pada kad
// lama sepatutnya mendarat pada sesuatu yang bermaruah dan berguna — bukan
// skrin ralat yang membuatkan dia rasa legasi itu sudah hilang.
export default function TiadaRekodView({
  slug,
  records,
}: {
  slug: string;
  records: LegacyRecord[];
}) {
  const { t } = useLang();

  return (
    <section className="mx-auto max-w-3xl px-6 py-28">
      <span className="font-sans text-sm font-semibold uppercase tracking-[0.3em] text-amber">
        {t("Dewan Legasi", "Hall of Legacy")}
      </span>
      <h1 className="display mt-5 text-4xl text-paper sm:text-5xl">
        {t("Rekod ini belum tersedia", "This record isn't available yet")}
      </h1>
      <p className="mt-6 font-sans text-base leading-relaxed text-muted">
        {t(
          `Alamat "${slug}" belum mempunyai rekod yang tersiar. Ia mungkin masih disediakan, atau alamatnya tersalah taip.`,
          `The address "${slug}" has no published record yet. It may still be in preparation, or the address was mistyped.`,
        )}{" "}
        {t(
          "Alamat ini kekal milik rekod itu — ia tidak akan diberikan kepada sesiapa yang lain.",
          "This address stays reserved for that record — it will never be given to anyone else.",
        )}
      </p>

      {records.length > 0 && (
        <div className="mt-12">
          <h2 className="font-sans text-sm font-semibold uppercase tracking-widest text-muted">
            {t("Rekod yang sudah tersiar", "Records already published")}
          </h2>
          <ul className="mt-4 divide-y divide-line border-y border-line">
            {records.map((r) => (
              <li key={r.slug}>
                <Link
                  href={`/legasi/${r.slug}`}
                  className="flex items-baseline justify-between gap-4 py-4 transition-colors hover:text-amber"
                >
                  <span className="font-sans text-base text-paper">{r.fullName}</span>
                  <span className="shrink-0 font-sans text-xs uppercase tracking-wider text-muted">
                    {r.recordNo} · {r.cohort}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Link
        href="/legasi"
        className="mt-12 inline-block rounded-full border border-amber px-7 py-3 font-sans text-sm font-semibold uppercase tracking-wider text-amber transition-colors hover:bg-amber hover:text-ink"
      >
        {t("Lihat Dewan Legasi →", "View the Hall of Legacy →")}
      </Link>
    </section>
  );
}
