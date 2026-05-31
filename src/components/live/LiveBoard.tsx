"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { matchResult } from "@/lib/match";

type Season = { id: string; name: string };
type Match = {
  id: string;
  season_id: string | null;
  opponent: string;
  match_date: string | null;
  competition: string | null;
  venue: string | null;
  our_score: number | null;
  opp_score: number | null;
};
type Stat = { match_id: string; user_id: string; stats: Record<string, number> };
type Player = { clerk_user_id: string; name: string | null };

function record(matches: Match[]) {
  let played = 0, win = 0, draw = 0, loss = 0, gf = 0, ga = 0;
  for (const m of matches) {
    const r = matchResult(m.our_score, m.opp_score);
    if (!r) continue;
    played++;
    gf += m.our_score ?? 0;
    ga += m.opp_score ?? 0;
    if (r.tone === "win") win++;
    else if (r.tone === "draw") draw++;
    else loss++;
  }
  return { played, win, draw, loss, gf, ga };
}

export default function LiveBoard({
  seasons,
  matches,
  stats,
  players,
}: {
  seasons: Season[];
  matches: Match[];
  stats: Stat[];
  players: Player[];
}) {
  const router = useRouter();
  const [seasonId, setSeasonId] = useState(seasons[0]?.id ?? "");

  // Auto-segar setiap 60s (live).
  useEffect(() => {
    const t = setInterval(() => router.refresh(), 60000);
    return () => clearInterval(t);
  }, [router]);

  const nameById = useMemo(
    () => new Map(players.map((p) => [p.clerk_user_id, p.name || "Ahli"])),
    [players]
  );

  const seasonMatches = useMemo(
    () => matches.filter((m) => m.season_id === seasonId),
    [matches, seasonId]
  );
  const seasonMatchIds = useMemo(() => new Set(seasonMatches.map((m) => m.id)), [seasonMatches]);

  const rec = useMemo(() => record(seasonMatches), [seasonMatches]);
  const overall = useMemo(() => record(matches), [matches]);

  // Peneraju season.
  const leaders = useMemo(() => {
    const tot: Record<string, Record<string, number>> = {};
    for (const s of stats) {
      if (!seasonMatchIds.has(s.match_id)) continue;
      const acc = (tot[s.user_id] ??= {});
      for (const [k, v] of Object.entries(s.stats ?? {})) acc[k] = (acc[k] ?? 0) + v;
    }
    const top = (key: string, n = 3) =>
      Object.entries(tot)
        .map(([uid, m]) => ({ name: nameById.get(uid) || "Ahli", value: m[key] ?? 0 }))
        .filter((x) => x.value > 0)
        .sort((a, b) => b.value - a.value)
        .slice(0, n);
    return { scorers: top("goals"), assists: top("assists"), saves: top("save") };
  }, [stats, seasonMatchIds, nameById]);

  // Penjaring/assist bagi satu perlawanan.
  const contributors = (matchId: string, key: string) =>
    stats
      .filter((s) => s.match_id === matchId && (s.stats[key] ?? 0) > 0)
      .map((s) => `${nameById.get(s.user_id) || "Ahli"} (${s.stats[key]})`);

  const latest = seasonMatches.find((m) => m.our_score != null) ?? seasonMatches[0];

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
          <h1 className="display mt-3 text-5xl leading-none text-paper sm:text-6xl">
            Perlawanan
          </h1>
        </div>
        {seasons.length > 0 && (
          <select
            value={seasonId}
            onChange={(e) => setSeasonId(e.target.value)}
            className="rounded-lg border border-line bg-ink px-4 py-2.5 font-sans text-sm text-paper outline-none focus:border-amber"
          >
            {seasons.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {seasons.length === 0 ? (
        <p className="mt-10 font-sans text-muted">
          Belum ada perlawanan. Nantikan kemas kini! 🐝
        </p>
      ) : (
        <>
          {/* Perlawanan terkini */}
          {latest && (
            <div className="mt-10 rounded-3xl border border-amber/40 bg-amber/5 p-6 sm:p-8">
              <p className="font-sans text-xs font-semibold uppercase tracking-wider text-amber">
                Perlawanan Terkini
              </p>
              <div className="mt-3 flex items-center justify-between gap-4">
                <span className="display text-2xl text-paper sm:text-3xl">Stingers</span>
                <span className="display text-4xl text-amber sm:text-5xl">
                  {latest.our_score ?? "-"} : {latest.opp_score ?? "-"}
                </span>
                <span className="display text-2xl text-paper sm:text-3xl">{latest.opponent}</span>
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-center gap-2 font-sans text-xs text-muted">
                {latest.competition && <span>{latest.competition}</span>}
                {latest.match_date && <span>· {latest.match_date}</span>}
                {latest.venue && <span>· {latest.venue}</span>}
                <ResultBadge our={latest.our_score} opp={latest.opp_score} />
              </div>
              {contributors(latest.id, "goals").length > 0 && (
                <p className="mt-3 text-center font-sans text-sm text-paper/90">
                  ⚽ {contributors(latest.id, "goals").join(", ")}
                </p>
              )}
            </div>
          )}

          {/* Rumusan season */}
          <h2 className="mt-12 font-sans text-sm font-semibold uppercase tracking-wider text-muted">
            Rumusan Season
          </h2>
          <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
            {[
              { l: "Main", v: rec.played },
              { l: "Menang", v: rec.win },
              { l: "Seri", v: rec.draw },
              { l: "Kalah", v: rec.loss },
              { l: "Jaring", v: rec.gf },
              { l: "Kemasukan", v: rec.ga },
            ].map((x) => (
              <div key={x.l} className="rounded-xl border border-line bg-bg-soft/50 py-3 text-center">
                <div className="display text-2xl text-amber">{x.v}</div>
                <div className="font-sans text-[0.65rem] uppercase tracking-wide text-muted">{x.l}</div>
              </div>
            ))}
          </div>

          {/* Peneraju */}
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <LeaderCard title="Penjaring Terbanyak" unit="gol" rows={leaders.scorers} />
            <LeaderCard title="Assist Terbanyak" unit="assist" rows={leaders.assists} />
            <LeaderCard title="Save Terbanyak" unit="save" rows={leaders.saves} />
          </div>

          {/* Senarai perlawanan */}
          <h2 className="mt-12 font-sans text-sm font-semibold uppercase tracking-wider text-muted">
            Semua Perlawanan
          </h2>
          <div className="mt-3 flex flex-col gap-2">
            {seasonMatches.length === 0 && (
              <p className="font-sans text-sm text-muted">Belum ada perlawanan dalam season ini.</p>
            )}
            {seasonMatches.map((m) => {
              const scorers = contributors(m.id, "goals");
              return (
                <div key={m.id} className="rounded-xl border border-line bg-bg-soft/50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-sans text-sm font-semibold text-paper">
                      Stingers vs {m.opponent}
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="display text-xl text-amber">
                        {m.our_score ?? "-"}:{m.opp_score ?? "-"}
                      </span>
                      <ResultBadge our={m.our_score} opp={m.opp_score} />
                    </span>
                  </div>
                  <p className="mt-1 font-sans text-xs text-muted">
                    {[m.competition, m.match_date, m.venue].filter(Boolean).join(" · ")}
                  </p>
                  {scorers.length > 0 && (
                    <p className="mt-1.5 font-sans text-xs text-paper/80">⚽ {scorers.join(", ")}</p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Rekod keseluruhan */}
          <h2 className="mt-12 font-sans text-sm font-semibold uppercase tracking-wider text-muted">
            Rekod Keseluruhan (Semua Season)
          </h2>
          <p className="mt-2 font-sans text-sm text-paper/90">
            {overall.played} perlawanan · <span className="text-amber">{overall.win} menang</span> ·{" "}
            {overall.draw} seri · {overall.loss} kalah · {overall.gf} jaring · {overall.ga} kemasukan
          </p>
        </>
      )}
    </section>
  );
}

function ResultBadge({ our, opp }: { our: number | null; opp: number | null }) {
  const r = matchResult(our, opp);
  if (!r) return null;
  return (
    <span
      className={`rounded-full px-2 py-0.5 font-sans text-[0.65rem] font-semibold ${
        r.tone === "win"
          ? "bg-amber text-ink"
          : r.tone === "draw"
            ? "bg-paper/15 text-paper"
            : "bg-red-500/20 text-red-400"
      }`}
    >
      {r.label}
    </span>
  );
}

function LeaderCard({
  title,
  unit,
  rows,
}: {
  title: string;
  unit: string;
  rows: { name: string; value: number }[];
}) {
  return (
    <div className="rounded-xl border border-line bg-bg-soft/50 p-4">
      <p className="font-sans text-xs font-semibold uppercase tracking-wider text-muted">{title}</p>
      {rows.length === 0 ? (
        <p className="mt-2 font-sans text-sm text-muted">—</p>
      ) : (
        <ol className="mt-2 flex flex-col gap-1">
          {rows.map((r, i) => (
            <li key={i} className="flex items-center justify-between font-sans text-sm">
              <span className="text-paper">
                {i + 1}. {r.name}
              </span>
              <span className="font-semibold text-amber">
                {r.value} {unit}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
