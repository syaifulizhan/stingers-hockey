import { createPublicSupabase } from "@/lib/supabase/public";
import LiveBannerView from "@/components/live/LiveBannerView";

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
//
// Komponen ini mengambil data sahaja. Markupnya duduk dalam LiveBannerView
// (client) supaya label antara muka mengikut pil BM/EN, yang hanya wujud di
// pelayar.
export default async function LiveBanner() {
  const supabase = createPublicSupabase();

  const { data: seasons } = await supabase.from("seasons").select("id").eq("closed", false);
  const openIds = (seasons ?? []).map((s) => s.id as string);
  if (openIds.length === 0) return null;

  const { data: matchesData } = await supabase
    .from("matches")
    .select("id, opponent, match_date, competition, category, our_score, opp_score, created_at")
    .in("season_id", openIds)
    .order("created_at", { ascending: false })
    .limit(50);
  const matches = (matchesData ?? []) as Match[];
  if (matches.length === 0) return null;

  const latest = [...matches].sort((a, b) => recency(b) - recency(a))[0];

  // Penjaring untuk match ini.
  const [statsRes, playersRes] = await Promise.all([
    supabase.from("match_stats").select("user_id, stats").eq("match_id", latest.id),
    supabase.from("public_players").select("clerk_user_id, name"),
  ]);
  const nameById = new Map(
    (playersRes.data ?? []).map((p) => [p.clerk_user_id as string, (p.name as string) || null])
  );
  // Nama dihantar mentah (null bila tiada). Teks gantian "Ahli"/"Member"
  // dipilih di dalam paparan, di mana bahasa diketahui.
  const scorers = (statsRes.data ?? [])
    .filter((s) => ((s.stats as Record<string, number>)?.goals ?? 0) > 0)
    .map((s) => ({
      name: nameById.get(s.user_id as string) ?? null,
      goals: (s.stats as Record<string, number>).goals,
    }));

  return (
    <LiveBannerView
      opponent={latest.opponent}
      ourScore={latest.our_score}
      oppScore={latest.opp_score}
      scorers={scorers}
    />
  );
}
