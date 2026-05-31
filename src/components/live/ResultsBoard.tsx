"use client";

import { useMemo, useState } from "react";
import SeasonResultView, {
  type LiveMatch,
  type LiveStat,
  type LivePlayer,
} from "@/components/live/SeasonResultView";
import { matchResult } from "@/lib/match";
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

export default function ResultsBoard({
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
  const [seasonId, setSeasonId] = useState(seasons[0]?.id ?? "");

  const seasonMatches = useMemo(
    () => matches.filter((m) => m.season_id === seasonId),
    [matches, seasonId]
  );
  const seasonAchievements = useMemo(
    () => achievements.filter((a) => a.season_id === seasonId),
    [achievements, seasonId]
  );

  // Rekod keseluruhan (semua season ditutup).
  const overall = useMemo(() => {
    let played = 0, win = 0, draw = 0, loss = 0;
    for (const m of matches) {
      const r = matchResult(m.our_score, m.opp_score);
      if (!r) continue;
      played++;
      if (r.tone === "win") win++;
      else if (r.tone === "draw") draw++;
      else loss++;
    }
    return { played, win, draw, loss };
  }, [matches]);

  return (
    <section className="mx-auto max-w-3xl px-6 pt-32 pb-20 sm:pt-40">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="font-sans text-sm font-semibold uppercase tracking-[0.3em] text-amber">
            Arkib
          </span>
          <h1 className="display mt-3 text-5xl leading-none text-paper sm:text-6xl">Keputusan</h1>
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
          <ShareButton title="Keputusan — Stingers Hockey" />
        </div>
      </div>

      {seasons.length === 0 ? (
        <div className="mt-12 rounded-2xl border border-line bg-bg-soft/50 p-8 text-center">
          <p className="font-sans text-paper/90">Belum ada season yang ditutup.</p>
          <p className="mt-1 font-sans text-sm text-muted">
            Lihat perlawanan semasa di halaman{" "}
            <a href="/live" className="text-amber hover:underline">
              Live
            </a>
            .
          </p>
        </div>
      ) : (
        <>
          <p className="mt-6 font-sans text-sm text-paper/90">
            Rekod keseluruhan: {overall.played} perlawanan ·{" "}
            <span className="text-amber">{overall.win} menang</span> · {overall.draw} seri ·{" "}
            {overall.loss} kalah
          </p>
          <SeasonResultView
            matches={seasonMatches}
            stats={stats}
            players={players}
            achievements={seasonAchievements}
          />
        </>
      )}
    </section>
  );
}
