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
  const { data: editions } = await supabase
    .from("jersey_editions")
    .select("*")
    .order("sort_order", { ascending: true });
  const jerseyItems: Jersey[] = (editions ?? []).map((e) => ({
    id: e.id,
    name: e.name,
    year: e.year ?? "",
    tournament: e.tournament ?? "",
    region: e.region ?? "",
    venue: e.venue ?? "",
    note: e.note ?? undefined,
    image: e.image_url ?? "",
  }));

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
        <JerseyGallery items={jerseyItems} />
        <HustleGear />
        <Sponsors />
      </main>
      <Footer />
    </>
  );
}
