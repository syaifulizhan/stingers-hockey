"use client";

import Honeycomb from "@/components/ui/Honeycomb";
import Reveal from "@/components/ui/Reveal";
import SmartImage from "@/components/ui/SmartImage";
import { useLang } from "@/lib/i18n";

export default function LogoStory() {
  const { t } = useLang();

  const features = [
    {
      title: t("Kelulut Terminata", "The Terminata Stingless Bee"),
      body: t(
        "Berasaskan kelulut spesies Lepidotrigona Terminata yang bersedia menyengat — lambang ketangkasan, kelajuan dan semangat berpasukan.",
        "Inspired by the Lepidotrigona Terminata stingless bee, ready to sting — a symbol of agility, speed and team spirit."
      ),
    },
    {
      title: t("Huruf Tersembunyi 'S' & 'H'", "Hidden Letters 'S' & 'H'"),
      body: t(
        "Toraks serangga dibentuk huruf 'S' (Stingers), disambung huruf 'H' (Hockey) di tengah badan.",
        "The insect's thorax forms the letter 'S' (Stingers), joined by an 'H' (Hockey) in the middle of the body."
      ),
    },
    {
      title: t("Kayu & Bola Hoki", "Hockey Stick & Ball"),
      body: t(
        "Abdomen serangga terbentuk daripada visual kayu dan bola hoki, diakhiri sengat tajam di hujung.",
        "The abdomen is formed from a hockey stick and ball, ending in a sharp stinger at the tip."
      ),
    },
    {
      title: t("Sayap Geometri", "Geometric Wings"),
      body: t(
        "Corak sarang lebah pada sayap melambangkan pergerakan dinamik dan strategi tersusun untuk 'terbang tinggi'.",
        "The honeycomb pattern on the wings represents dynamic movement and organised strategy to 'fly high'."
      ),
    },
  ];

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
              {t("Identiti", "Identity")}
            </span>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="display mt-5 text-5xl text-paper sm:text-6xl lg:text-7xl">
              {t("Kisah Di Sebalik", "The Story Behind the")}{" "}
              <span className="text-outline">Logo</span>
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
