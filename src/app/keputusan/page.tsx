import type { Metadata } from "next";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import ResultsBoard from "@/components/live/ResultsBoard";
import { createPublicSupabase } from "@/lib/supabase/public";

export const metadata: Metadata = {
  title: "Keputusan — Stingers Hockey",
  description:
    "Arkib keputusan season pasukan Stingers Hockey — rekod perlawanan, penjaring & assist terbanyak.",
};

export const dynamic = "force-dynamic";

export default async function KeputusanPage() {
  const supabase = createPublicSupabase();
  const [seasonsRes, matchesRes, statsRes, playersRes] = await Promise.all([
    // Hanya season DITUTUP muncul di Keputusan.
    supabase.from("seasons").select("id, name").eq("closed", true).order("created_at", { ascending: false }),
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
        <ResultsBoard
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
