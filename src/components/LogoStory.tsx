"use client";

import Honeycomb from "@/components/ui/Honeycomb";
import Reveal from "@/components/ui/Reveal";

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
        {/* Kiri — visual logo */}
        <Reveal className="flex justify-center">
          <div className="relative flex aspect-square w-full max-w-md items-center justify-center">
            {/* 3 bulatan konsentrik */}
            <div className="absolute inset-0 rounded-full border border-line" />
            <div className="absolute inset-[12%] rounded-full border border-amber/40" />
            <div className="absolute inset-[24%] rounded-full border border-line" />
            {/* Glow amber */}
            <div className="absolute inset-[30%] rounded-full bg-amber/20 blur-3xl" />
            {/* Logo di tengah */}
            {/* eslint-disable-next-line @next/next/no-img-element -- fallback teks bila imej tiada */}
            <img
              src="/images/logo.png"
              alt="Logo Stingers Hockey — kelulut Terminata"
              className="relative z-10 w-2/5 object-contain drop-shadow-[0_0_24px_rgba(245,180,0,0.4)]"
              onError={(e) => {
                const el = e.currentTarget as HTMLImageElement;
                el.style.display = "none";
                el.nextElementSibling?.classList.remove("hidden");
              }}
            />
            <span className="display absolute z-10 hidden text-7xl text-amber">
              SH
            </span>
          </div>
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
