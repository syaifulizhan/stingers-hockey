import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { createPublicSupabase } from "@/lib/supabase/public";
import { matchResult } from "@/lib/match";

type Match = {
  id: string;
  opponent: string;
  match_date: string | null;
  competition: string | null;
  category: string | null;
  our_score: number | null;
  opp_score: number | null;
  created_at: string | null;
};

// "Terkini" = paling baru direkod (created_at); fallback ke tarikh perlawanan.
function recency(m: Match): number {
  const ms = new Date(m.created_at ?? m.match_date ?? "").getTime();
  return Number.isNaN(ms) ? 0 : ms;
}

// Banner perlawanan terkini di muka depan — muncul bila ada season terbuka.
// Klik → /live.
export default async function LiveBanner() {
  const supabase = createPublicSupabase();

  const { data: seasons } = await supabase.from("seasons").select("id").eq("closed", false);
  const openIds = (seasons ?? []).map((s) => s.id as string);
  if (openIds.length === 0) return null;

  const { data: matchesData } = await supabase
    .from("matches")
    .select("id, opponent, match_date, competition, category, our_score, opp_score, created_at")
    .in("season_id", openIds);
  const matches = (matchesData ?? []) as Match[];
  if (matches.length === 0) return null;

  const latest = [...matches].sort((a, b) => recency(b) - recency(a))[0];

  // Penjaring untuk match ini.
  const [statsRes, playersRes] = await Promise.all([
    supabase.from("match_stats").select("user_id, stats").eq("match_id", latest.id),
    supabase.from("public_players").select("clerk_user_id, name"),
  ]);
  const nameById = new Map(
    (playersRes.data ?? []).map((p) => [p.clerk_user_id as string, (p.name as string) || "Ahli"])
  );
  const scorers = (statsRes.data ?? [])
    .filter((s) => ((s.stats as Record<string, number>)?.goals ?? 0) > 0)
    .map((s) => `${nameById.get(s.user_id as string) || "Ahli"} (${(s.stats as Record<string, number>).goals})`);

  const r = matchResult(latest.our_score, latest.opp_score);
  const hasScore = latest.our_score != null && latest.opp_score != null;

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
              {latest.our_score}:{latest.opp_score}
            </span>
          ) : (
            <span className="font-sans text-sm text-muted">vs</span>
          )}
          <span className="display text-xl text-paper sm:text-2xl">{latest.opponent}</span>
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
              {r.label}
            </span>
          )}
        </span>

        <span className="inline-flex items-center gap-1 font-sans text-sm font-semibold text-amber">
          <span className="hidden sm:inline">Lihat Live</span>
          <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </span>
      </Link>
      {scorers.length > 0 && (
        <p className="mt-1.5 text-center font-sans text-xs text-muted">⚽ {scorers.join(", ")}</p>
      )}
    </section>
  );
}
