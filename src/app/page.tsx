import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import Marquee from "@/components/Marquee";
import About from "@/components/About";
import Training from "@/components/Training";
import LogoStory from "@/components/LogoStory";
import JerseyGallery from "@/components/JerseyGallery";
import HustleGear from "@/components/HustleGear";
import Berita from "@/components/Berita";
import RegisterForm from "@/components/RegisterForm";
import Sponsors from "@/components/Sponsors";
import Footer from "@/components/Footer";

// Jana semula halaman setiap 60 saat supaya berita terkini muncul (ISR).
export const revalidate = 60;

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
        <RegisterForm />
        <Sponsors />
      </main>
      <Footer />
    </>
  );
}
