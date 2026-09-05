import type { Metadata } from "next";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import LiveBoard from "@/components/live/LiveBoard";
import JsonLd from "@/components/JsonLd";
import { createPublicSupabase } from "@/lib/supabase/public";
import { canonical, ogHalaman, SITE_NAME } from "@/lib/seo";
import { breadcrumbs, graf } from "@/lib/jsonld";

export const metadata: Metadata = {
  title: `Live — Perlawanan Hoki ${SITE_NAME}`,
  description:
    "Keputusan perlawanan hoki terkini, rumusan musim, penjaring dan assist terbanyak pasukan Stingers Hockey, SK Taman Desaminium.",
  alternates: { canonical: canonical("/live") },
  openGraph: ogHalaman({
    title: `Live — Perlawanan Hoki ${SITE_NAME}`,
    description:
      "Keputusan perlawanan hoki terkini dan rumusan musim pasukan Stingers Hockey.",
    path: "/live",
  }),
};

// Sentiasa segar (live).
export const dynamic = "force-dynamic";

export default async function LivePage() {
  const supabase = createPublicSupabase();
  const [seasonsRes, matchesRes, statsRes, playersRes, achievementsRes] = await Promise.all([
    // Hanya season TERBUKA muncul di Live.
    supabase.from("seasons").select("id, name, team").eq("closed", false).order("created_at", { ascending: false }),
    supabase
      .from("matches")
      .select("id, season_id, opponent, match_date, competition, category, venue, our_score, opp_score, created_at")
      .order("created_at", { ascending: false }),
    supabase.from("match_stats").select("match_id, user_id, position, stats"),
    supabase.from("public_players").select("clerk_user_id, name"),
    supabase.from("achievements").select("season_id, category, award, player_id, event"),
  ]);

  return (
    <>
      <JsonLd json={graf(breadcrumbs([{ nama: "Live" }]))} />
      <Navigation />
      <main className="flex-1">
        <LiveBoard
          seasons={(seasonsRes.data ?? []) as { id: string; name: string; team: string }[]}
          matches={(matchesRes.data ?? []) as never[]}
          stats={(statsRes.data ?? []) as never[]}
          players={(playersRes.data ?? []) as { clerk_user_id: string; name: string | null }[]}
          achievements={(achievementsRes.data ?? []) as never[]}
        />
      </main>
      <Footer />
    </>
  );
}
