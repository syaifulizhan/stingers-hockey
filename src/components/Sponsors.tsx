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
    kind: "text",
    name: "Tunas Jaya Resources",
    highlight: "Tunas Jaya",
    small: "Resources",
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
          <div className="mt-10 flex flex-wrap justify-center gap-6">
            {sponsors.map((s) => (
              <motion.div
                key={s.name}
                whileHover={{ scale: 1.04 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="rounded-xl border border-line bg-bg-soft/60 p-6"
              >
                {s.kind === "logo" ? (
                  <SmartImage
                    src={s.image}
                    alt={`Penaja: ${s.name}`}
                    label={s.name}
                    className="h-28 w-56"
                    sizes="224px"
                    fit="contain"
                  />
                ) : (
                  <div className="flex h-28 w-56 flex-col items-center justify-center text-center">
                    <span className="display text-3xl leading-tight text-paper">
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
