"use client";

import Honeycomb from "@/components/ui/Honeycomb";
import Reveal from "@/components/ui/Reveal";
import SmartImage from "@/components/ui/SmartImage";

const features = [
  {
    title: "Kelulut Terminata",
    body: (
      <>
        Berasaskan kelulut spesies <em>Lepidotrigona Terminata</em> yang
        bersedia menyengat — lambang ketangkasan, kelajuan dan semangat
        berpasukan.
      </>
    ),
  },
  {
    title: "Huruf Tersembunyi 'S' & 'H'",
    body: (
      <>
        Toraks serangga dibentuk huruf &lsquo;S&rsquo; (Stingers), disambung
        huruf &lsquo;H&rsquo; (Hockey) di tengah badan.
      </>
    ),
  },
  {
    title: "Kayu & Bola Hoki",
    body: (
      <>
        Abdomen serangga terbentuk daripada visual kayu dan bola hoki, diakhiri
        sengat tajam di hujung.
      </>
    ),
  },
  {
    title: "Sayap Geometri",
    body: (
      <>
        Corak sarang lebah pada sayap melambangkan pergerakan dinamik dan
        strategi tersusun untuk &lsquo;terbang tinggi&rsquo;.
      </>
    ),
  },
];

export default function LogoStory() {
  return (
    <section
      id="logo"
      className="relative overflow-hidden bg-bg-soft py-24 sm:py-32"
    >
      <Honeycomb opacity={0.09} radius={32} className="-z-0" />

      <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-16 px-6 lg:grid-cols-2 lg:gap-20">
        {/* Kiri — visual kisah logo (logo + kelulut sebenar) */}
        <Reveal className="flex justify-center">
          <SmartImage
            src="/images/kisah-logo.png"
            alt="Logo Stingers Hockey berbanding kelulut Terminata sebenar"
            label="Kisah Logo"
            className="aspect-square w-full max-w-md rounded-2xl border border-line"
            sizes="(max-width: 1024px) 100vw, 40vw"
            fit="cover"
          />
        </Reveal>

        {/* Kanan — teks */}
        <div>
          <Reveal>
            <span className="font-sans text-sm font-semibold uppercase tracking-[0.3em] text-amber">
              Identiti
            </span>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="display mt-5 text-5xl text-paper sm:text-6xl lg:text-7xl">
              Kisah Di Sebalik <span className="text-outline">Logo</span>
            </h2>
          </Reveal>

          <div className="mt-10 flex flex-col gap-6">
            {features.map((f, i) => (
              <Reveal key={f.title} delay={i * 0.08}>
                <div className="group border-l border-line pl-5 transition-colors hover:border-amber">
                  <h3 className="font-sans text-lg font-semibold text-paper">
                    {f.title}
                  </h3>
                  <p className="mt-1.5 font-sans text-base leading-relaxed text-muted">
                    {f.body}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
