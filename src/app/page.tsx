import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import Marquee from "@/components/Marquee";
import About from "@/components/About";
import Training from "@/components/Training";
import LogoStory from "@/components/LogoStory";
import JerseyGallery from "@/components/JerseyGallery";
import HustleGear from "@/components/HustleGear";
import RegisterForm from "@/components/RegisterForm";
import Sponsors from "@/components/Sponsors";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Navigation />
      <main className="flex-1">
        <Hero />
        <Marquee />
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
