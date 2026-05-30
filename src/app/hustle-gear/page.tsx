import type { Metadata } from "next";
import Navigation from "@/components/Navigation";
import OrderForm from "@/components/OrderForm";
import Footer from "@/components/Footer";
import SmartImage from "@/components/ui/SmartImage";
import Reveal from "@/components/ui/Reveal";
import Button from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Tempah Hustle Gear — Stingers Hockey",
  description:
    "Borang tempahan training kit rasmi Stingers Hockey 2026 — Hustle Gear.",
};

export default function HustleGearPage() {
  return (
    <>
      <Navigation />
      <main className="flex-1">
        {/* Hero ringkas */}
        <section className="relative overflow-hidden pt-36 pb-16 sm:pt-44 sm:pb-20">
          <div className="pointer-events-none absolute -right-24 top-10 h-72 w-72 rounded-full bg-amber/20 blur-3xl" />
          <div className="pointer-events-none absolute -left-24 bottom-0 h-64 w-64 rounded-full bg-amber-deep/15 blur-3xl" />
          <div className="relative mx-auto grid max-w-7xl gap-10 px-6 lg:grid-cols-[1.3fr_1fr] lg:items-center lg:gap-12">
            <div>
              <Reveal>
                <span className="font-sans text-sm font-semibold uppercase tracking-[0.3em] text-amber">
                  Training Kit 2026
                </span>
              </Reveal>
              <Reveal delay={0.1}>
                <h1 className="display mt-5 text-6xl text-paper sm:text-7xl">
                  Hustle Gear
                  <br />
                  <span className="text-amber">Buat Tempahan</span>
                </h1>
              </Reveal>
              <Reveal delay={0.15}>
                <p className="mt-6 max-w-lg font-sans text-base leading-relaxed text-muted">
                  Pakaian rasmi sesi latihan pasukan — direka khas untuk
                  keselesaan dan identiti pemain Stingers Hockey di padang.
                  Tempah saiz anda di bawah.
                </p>
              </Reveal>
              <Reveal delay={0.2}>
                <div className="mt-8 flex flex-wrap gap-4">
                  <Button href="#tempah">Borang Tempahan →</Button>
                  <Button href="/" variant="outline">
                    Kembali ke Laman Utama
                  </Button>
                </div>
              </Reveal>
            </div>

            <Reveal delay={0.1}>
              <SmartImage
                src="/images/hustle-gear-2026.png"
                alt="Hustle Gear training kit Stingers Hockey 2026"
                label="Hustle Gear"
                className="aspect-square w-full rounded-2xl border border-line"
                sizes="(max-width: 1024px) 100vw, 40vw"
                fit="contain"
              />
            </Reveal>
          </div>
        </section>

        <OrderForm />
      </main>
      <Footer />
    </>
  );
}
