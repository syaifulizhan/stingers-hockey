"use client";

import { motion } from "framer-motion";
import Reveal from "@/components/ui/Reveal";
import SmartImage from "@/components/ui/SmartImage";

const stats = [
  { value: "2017", label: "Ditubuhkan" },
  { value: "13+", label: "Edisi Jersi" },
  { value: "2", label: "Skuad L & P" },
  { value: "∞", label: "Semangat Juang" },
];

export default function About() {
  return (
    <section id="tentang" className="bg-bg-soft py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6">
       <div className="grid gap-14 lg:grid-cols-[1.5fr_1fr] lg:gap-20">
        {/* Kiri */}
        <div>
          <Reveal>
            <span className="font-sans text-sm font-semibold uppercase tracking-[0.3em] text-amber">
              Tentang Kami
            </span>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="display mt-5 text-5xl text-paper sm:text-6xl lg:text-7xl">
              Bukan Sekadar{" "}
              <span className="text-outline">Percubaan</span>
            </h2>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="mt-7 max-w-xl font-sans text-lg leading-relaxed text-muted">
              Ini peluang untuk{" "}
              <strong className="font-semibold text-paper">
                tunjuk kehebatan anda
              </strong>
              . Stingers Hockey menjadi tempat pemain berlatih bersungguh-sungguh,
              bermain dengan semangat, dan sentiasa maju. Kami mencari bakat
              baharu yang bersedia meningkat ke peringkat seterusnya.{" "}
              <strong className="font-semibold text-amber">
                Tampil. Menyinar.
              </strong>
            </p>
          </Reveal>
        </div>

        {/* Kanan — grid statistik 2×2 dengan pemisah hairline */}
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          variants={{ show: { transition: { staggerChildren: 0.1 } } }}
          className="grid grid-cols-2 overflow-hidden rounded-2xl border border-line"
        >
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              variants={{
                hidden: { opacity: 0, y: 20 },
                show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
              }}
              className={`flex flex-col justify-center gap-1 p-7 sm:p-9 ${
                i % 2 === 0 ? "border-r border-line" : ""
              } ${i < 2 ? "border-b border-line" : ""}`}
            >
              <span className="display text-5xl text-amber sm:text-6xl">
                {stat.value}
              </span>
              <span className="font-sans text-sm uppercase tracking-wider text-muted">
                {stat.label}
              </span>
            </motion.div>
          ))}
        </motion.div>
       </div>

        {/* Foto pasukan */}
        <Reveal delay={0.15}>
          <SmartImage
            src="/images/about-team1.jpg"
            alt="Skuad Stingers Hockey"
            label="Skuad Stingers"
            className="mt-14 aspect-[16/10] w-full rounded-2xl border border-line sm:aspect-[16/7]"
            sizes="(max-width: 1024px) 100vw, 1200px"
          />
        </Reveal>
      </div>
    </section>
  );
}
