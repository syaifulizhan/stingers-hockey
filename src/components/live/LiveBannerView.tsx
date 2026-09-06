"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { labelKeputusan, matchResult } from "@/lib/match";
import { useLang } from "@/lib/i18n";

// Paparan banner perlawanan terkini di muka depan.
//
// Diasingkan daripada LiveBanner kerana bahasa hanya wujud di pelayar: pil
// BM/EN menyimpan pilihannya dalam localStorage, jadi komponen pelayan tidak
// boleh melihatnya. Semasa keseluruhan banner ialah komponen pelayan, "Lihat
// Live" dan lencana Menang/Kalah/Seri kekal Melayu walaupun pil ditekan.
// Pengambilan data kekal di pelayan; hanya markup berpindah ke sini.
export default function LiveBannerView({
  opponent,
  ourScore,
  oppScore,
  scorers,
}: {
  opponent: string;
  ourScore: number | null;
  oppScore: number | null;
  /** Nama penjaring seperti dalam DB — null bila baris pemain tiada nama. */
  scorers: { name: string | null; goals: number }[];
}) {
  const { lang, t } = useLang();
  const r = matchResult(ourScore, oppScore);
  const hasScore = ourScore != null && oppScore != null;
  const tanpaNama = t("Ahli", "Member");

  return (
    <section className="mx-auto max-w-7xl px-6 pt-16">
      <Link
        href="/live"
        className="group flex flex-wrap items-center justify-center gap-x-4 gap-y-2 rounded-2xl border border-amber/40 bg-amber/5 px-6 py-4 text-center transition-colors hover:border-amber hover:bg-amber/10 sm:flex-nowrap sm:justify-between sm:text-left"
      >
        <span className="inline-flex items-center gap-2 font-sans text-xs font-semibold uppercase tracking-[0.25em] text-amber">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber" />
          </span>
          Live
        </span>

        <span className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
          <span className="display text-xl text-paper sm:text-2xl">Stingers</span>
          {hasScore ? (
            <span className="display whitespace-nowrap text-2xl tabular-nums text-amber sm:text-3xl">
              {ourScore}:{oppScore}
            </span>
          ) : (
            <span className="font-sans text-sm text-muted">vs</span>
          )}
          <span className="display text-xl text-paper sm:text-2xl">{opponent}</span>
          {r && (
            <span
              className={`rounded-full px-2 py-0.5 font-sans text-[0.65rem] font-semibold ${
                r.tone === "win"
                  ? "bg-amber text-ink"
                  : r.tone === "draw"
                    ? "bg-paper/15 text-paper"
                    : "bg-red-500/20 text-red-400"
              }`}
            >
              {labelKeputusan(r, lang)}
            </span>
          )}
        </span>

        <span className="inline-flex items-center gap-1 font-sans text-sm font-semibold text-amber">
          <span className="hidden sm:inline">{t("Lihat Live", "Watch Live")}</span>
          <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </span>
      </Link>
      {scorers.length > 0 && (
        <p className="mt-1.5 text-center font-sans text-xs text-muted">
          ⚽{" "}
          {scorers.map((s) => `${s.name || tanpaNama} (${s.goals})`).join(", ")}
        </p>
      )}
    </section>
  );
}
