"use client";

import { motion } from "framer-motion";
import SmartImage from "@/components/ui/SmartImage";
import Reveal from "@/components/ui/Reveal";

const sponsors = [
  {
    name: "NDA Apparel",
    image: "/images/sponsors/nda-apparel.png",
  },
];

export default function Sponsors() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-6 text-center">
        <Reveal>
          <h2 className="font-sans text-sm font-semibold uppercase tracking-[0.3em] text-amber">
            Setinggi-tinggi Penghargaan Kepada Penaja Kami
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
                <SmartImage
                  src={s.image}
                  alt={`Penaja: ${s.name}`}
                  label={s.name}
                  className="h-28 w-56"
                  sizes="224px"
                  fit="contain"
                />
              </motion.div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
