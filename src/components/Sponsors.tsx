"use client";

import { motion } from "framer-motion";
import SmartImage from "@/components/ui/SmartImage";
import Reveal from "@/components/ui/Reveal";
import { useLang } from "@/lib/i18n";

// Penaja: ada yang berlogo (guna imej), ada yang tiada logo (guna teks bergaya).
type Sponsor =
  | { kind: "logo"; name: string; image: string }
  | { kind: "text"; name: string; highlight: string; small: string };

const sponsors: Sponsor[] = [
  {
    kind: "text",
    name: "Unit Kokurikulum SK Taman Desaminium",
    highlight: "Unit Kokurikulum",
    small: "SK Taman Desaminium",
  },
  {
    kind: "logo",
    name: "PIBG SK Taman Desaminium",
    image: "/images/sponsors/pibg.png",
  },
  {
    kind: "logo",
    name: "Tunas Jaya Resources",
    image: "/images/sponsors/tunas-jaya-resources.png",
  },
  // NDA Apparel — kad terakhir.
  {
    kind: "logo",
    name: "NDA Apparel",
    image: "/images/sponsors/nda-apparel.png",
  },
];

export default function Sponsors() {
  const { t } = useLang();
  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-6 text-center">
        <Reveal>
          <h2 className="font-sans text-sm font-semibold uppercase tracking-[0.3em] text-amber">
            {t(
              "Setinggi-tinggi Penghargaan Kepada Para Penaja Kami",
              "Our Heartfelt Thanks to Our Sponsors"
            )}
          </h2>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="mx-auto mt-10 grid max-w-md grid-cols-2 gap-3 sm:flex sm:max-w-none sm:flex-wrap sm:justify-center sm:gap-6">
            {sponsors.map((s) => (
              <motion.div
                key={s.name}
                whileHover={{ scale: 1.04 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="rounded-xl border border-line bg-bg-soft/60 p-4 sm:p-6"
              >
                {s.kind === "logo" ? (
                  <SmartImage
                    src={s.image}
                    alt={`Penaja: ${s.name}`}
                    label={s.name}
                    className="h-24 w-full sm:h-28 sm:w-56"
                    sizes="(max-width: 640px) 50vw, 224px"
                    fit="contain"
                  />
                ) : (
                  <div className="flex h-24 w-full flex-col items-center justify-center text-center sm:h-28 sm:w-56">
                    <span className="display text-2xl leading-tight text-paper sm:text-3xl">
                      {s.highlight}
                    </span>
                    <span className="mt-2 font-sans text-[0.7rem] font-semibold uppercase tracking-[0.25em] text-muted">
                      {s.small}
                    </span>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
