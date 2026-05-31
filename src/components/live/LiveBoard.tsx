"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import SeasonResultView, {
  type LiveMatch,
  type LiveStat,
  type LivePlayer,
} from "@/components/live/SeasonResultView";
import ShareButton from "@/components/ShareButton";

type Season = { id: string; name: string; team: string };
type Achievement = {
  season_id: string | null;
  category: string;
  award: string;
  player_id: string | null;
  event: string | null;
};
const teamLabel = (t?: string) => (t === "perempuan" ? "Perempuan" : "Lelaki");

export default function LiveBoard({
  seasons,
  matches,
  stats,
  players,
  achievements,
}: {
  seasons: Season[];
  matches: LiveMatch[];
  stats: LiveStat[];
  players: LivePlayer[];
  achievements: Achievement[];
}) {
  const router = useRouter();
  const [seasonId, setSeasonId] = useState(seasons[0]?.id ?? "");

  // Auto-segar setiap 60s (live).
  useEffect(() => {
    const t = setInterval(() => router.refresh(), 60000);
    return () => clearInterval(t);
  }, [router]);

  const seasonMatches = useMemo(
    () => matches.filter((m) => m.season_id === seasonId),
    [matches, seasonId]
  );
  const seasonAchievements = useMemo(
    () => achievements.filter((a) => a.season_id === seasonId),
    [achievements, seasonId]
  );

  return (
    <section className="mx-auto max-w-3xl px-6 pt-32 pb-20 sm:pt-40">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-2 font-sans text-sm font-semibold uppercase tracking-[0.3em] text-amber">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber" />
            </span>
            Live
          </span>
          <h1 className="display mt-3 text-5xl leading-none text-paper sm:text-6xl">Perlawanan</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {seasons.length > 0 && (
            <select
              value={seasonId}
              onChange={(e) => setSeasonId(e.target.value)}
              className="w-full max-w-full truncate rounded-lg border border-line bg-ink px-4 py-2.5 font-sans text-sm text-paper outline-none focus:border-amber sm:w-auto sm:max-w-xs"
            >
              {seasons.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} — {teamLabel(s.team)}
                </option>
              ))}
            </select>
          )}
          <ShareButton title="Perlawanan Live — Stingers Hockey" />
        </div>
      </div>

      {seasons.length === 0 ? (
        <div className="mt-12 rounded-2xl border border-line bg-bg-soft/50 p-8 text-center">
          <p className="font-sans text-paper/90">Tiada perlawanan live sekarang.</p>
          <p className="mt-1 font-sans text-sm text-muted">
            Lihat keputusan season lepas di halaman{" "}
            <a href="/keputusan" className="text-amber hover:underline">
              Keputusan
            </a>
            .
          </p>
        </div>
      ) : (
        <SeasonResultView
          matches={seasonMatches}
          stats={stats}
          players={players}
          achievements={seasonAchievements}
          showLatest
        />
      )}
    </section>
  );
}
