import type { Metadata } from "next";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import LiveBoard from "@/components/live/LiveBoard";
import { createPublicSupabase } from "@/lib/supabase/public";

export const metadata: Metadata = {
  title: "Live — Perlawanan Stingers Hockey",
  description:
    "Keputusan perlawanan terkini, rumusan season, penjaring & assist terbanyak pasukan Stingers Hockey.",
};

// Sentiasa segar (live).
export const dynamic = "force-dynamic";

export default async function LivePage() {
  const supabase = createPublicSupabase();
  const [seasonsRes, matchesRes, statsRes, playersRes] = await Promise.all([
    supabase.from("seasons").select("id, name").order("created_at", { ascending: false }),
    supabase
      .from("matches")
      .select("id, season_id, opponent, match_date, competition, venue, our_score, opp_score")
      .order("match_date", { ascending: false }),
    supabase.from("match_stats").select("match_id, user_id, stats"),
    supabase.from("public_players").select("clerk_user_id, name"),
  ]);

  return (
    <>
      <Navigation />
      <main className="flex-1">
        <LiveBoard
          seasons={(seasonsRes.data ?? []) as { id: string; name: string }[]}
          matches={(matchesRes.data ?? []) as never[]}
          stats={(statsRes.data ?? []) as never[]}
          players={(playersRes.data ?? []) as { clerk_user_id: string; name: string | null }[]}
        />
      </main>
      <Footer />
    </>
  );
}
