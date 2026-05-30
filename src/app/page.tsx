import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import Marquee from "@/components/Marquee";
import About from "@/components/About";
import Training from "@/components/Training";
import LogoStory from "@/components/LogoStory";
import JerseyGallery from "@/components/JerseyGallery";
import HustleGear from "@/components/HustleGear";
import Berita from "@/components/Berita";
import Sponsors from "@/components/Sponsors";
import Footer from "@/components/Footer";

// Render segar setiap permintaan supaya berita terkini sentiasa muncul
// (elak cache fetch yang degil semasa berita ditambah/dipadam).
export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <>
      <Navigation />
      <main className="flex-1">
        <Hero />
        <Marquee />
        <Berita />
        <About />
        <Training />
        <LogoStory />
        <JerseyGallery />
        <HustleGear />
        <Sponsors />
      </main>
      <Footer />
    </>
  );
}
