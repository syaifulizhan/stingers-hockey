import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import Marquee from "@/components/Marquee";
import About from "@/components/About";
import Training from "@/components/Training";
import LogoStory from "@/components/LogoStory";
import JerseyGallery from "@/components/JerseyGallery";
import HustleGear from "@/components/HustleGear";
import Berita from "@/components/Berita";
import LiveBanner from "@/components/LiveBanner";
import Sponsors from "@/components/Sponsors";
import Footer from "@/components/Footer";
import { createPublicSupabase } from "@/lib/supabase/public";
import type { Jersey } from "@/lib/jerseys";

// Render segar setiap permintaan supaya berita terkini sentiasa muncul
// (elak cache fetch yang degil semasa berita ditambah/dipadam).
export const dynamic = "force-dynamic";

export default async function Home() {
  // Galeri Legasi Jersi dari Supabase (admin boleh edit). Komponen fallback
  // ke senarai statik jika senarai ini kosong.
  const supabase = createPublicSupabase();
  const [{ data: editions }, { data: prods }] = await Promise.all([
    supabase.from("jersey_editions").select("*").order("sort_order", { ascending: true }),
    supabase.from("shop_products").select("id, image_url"),
  ]);
  const jerseyImage = prods?.find((p) => p.id === "jersi")?.image_url ?? null;
  const hustleImage = prods?.find((p) => p.id === "hustle_gear")?.image_url ?? null;
  const mapEdition = (e: Record<string, unknown>): Jersey => ({
    id: e.id as string,
    name: e.name as string,
    year: (e.year as string) ?? "",
    tournament: (e.tournament as string) ?? "",
    region: (e.region as string) ?? "",
    venue: (e.venue as string) ?? "",
    note: (e.note as string) ?? undefined,
    image: (e.image_url as string) ?? "",
  });
  const all = editions ?? [];
  const jerseyItems: Jersey[] = all.filter((e) => (e.kind ?? "jersi") === "jersi").map(mapEdition);
  const hustleItems: Jersey[] = all.filter((e) => e.kind === "hustle_gear").map(mapEdition);

  return (
    <>
      <Navigation />
      <main className="flex-1">
        <Hero />
        <Marquee />
        <LiveBanner />
        <Berita />
        <About />
        <Training />
        <LogoStory />
        <JerseyGallery items={jerseyItems} variant="jersi" />
        <HustleGear jerseyImage={jerseyImage} hustleImage={hustleImage} />
        <JerseyGallery items={hustleItems} variant="hustle" />
        <Sponsors />
      </main>
      <Footer />
    </>
  );
}
