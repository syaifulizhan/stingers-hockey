"use client";

import Button from "@/components/ui/Button";
import SmartImage from "@/components/ui/SmartImage";
import Reveal from "@/components/ui/Reveal";

export default function HustleGear() {
  return (
    <section className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <Reveal>
          <div className="relative overflow-hidden rounded-2xl border border-line bg-bg-soft">
            {/* Cahaya kuning bersinar di sudut */}
            <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-amber/25 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-amber-deep/15 blur-3xl" />

            <div className="relative grid gap-10 p-8 sm:p-12 lg:grid-cols-[1.4fr_1fr] lg:items-center lg:gap-12">
              {/* Kiri — teks */}
              <div>
                <span className="font-sans text-sm font-semibold uppercase tracking-[0.3em] text-amber">
                  Training Kit 2026
                </span>
                <h2 className="display mt-5 text-5xl text-paper sm:text-6xl">
                  Hustle Gear
                  <br />
                  <span className="text-amber">Kini Kembali</span>
                </h2>
                <p className="mt-6 max-w-lg font-sans text-base leading-relaxed text-muted">
                  Pakaian rasmi sesi latihan pasukan — direka khas untuk
                  keselesaan dan identiti pemain Stingers Hockey di padang. Lebih
                  sporty, lebih eksklusif. Simbol semangat satu pasukan.
                </p>
                <div className="mt-8">
                  <Button href="#daftar">Buat Tempahan →</Button>
                </div>
              </div>

              {/* Kanan — visual */}
              <SmartImage
                src="/images/hustle-gear-2026.png"
                alt="Hustle Gear training kit Stingers Hockey 2026"
                label="Hustle Gear"
                className="aspect-square w-full rounded-xl border border-line"
                sizes="(max-width: 1024px) 100vw, 40vw"
                fit="contain"
              />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
