"use client";

import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import Honeycomb from "@/components/ui/Honeycomb";
import SmartImage from "@/components/ui/SmartImage";
import Button from "@/components/ui/Button";

// Reveal tajuk perkataan demi perkataan
const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.15 } },
};
const word = {
  hidden: { opacity: 0, y: "0.4em" },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  },
};

export default function Hero() {
  return (
    <section
      id="top"
      className="relative flex min-h-screen items-center overflow-hidden"
    >
      {/* Latar foto pemain */}
      <SmartImage
        src="/images/hero-player.jpg"
        alt="Pemain Stingers Hockey beraksi di padang"
        label="Hero — Gee Shariff"
        priority
        sizes="100vw"
        className="absolute inset-0 -z-20 h-full w-full"
      />
      {/* Gradient overlay gelap */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink via-ink/85 to-ink/40" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-ink/90 to-transparent" />
      {/* Honeycomb halus */}
      <Honeycomb opacity={0.07} className="-z-10" />

      <div className="mx-auto w-full max-w-7xl px-6 pt-28 pb-32">
        {/* Eyebrow */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-6 font-sans text-xs font-semibold uppercase tracking-[0.35em] text-amber sm:text-sm"
        >
          Pasukan Hoki Rasmi · SK Taman Desaminium
        </motion.p>

        {/* Tajuk besar */}
        <motion.h1
          variants={container}
          initial="hidden"
          animate="show"
          className="display max-w-4xl text-paper"
          style={{ fontSize: "clamp(60px, 13vw, 180px)" }}
        >
          <span className="block">
            <motion.span variants={word} className="inline-block">
              Strike{" "}
            </motion.span>
            <motion.span variants={word} className="inline-block text-amber">
              Hard
            </motion.span>
          </span>
          <span className="block">
            <motion.span variants={word} className="inline-block">
              Strike{" "}
            </motion.span>
            <motion.span variants={word} className="inline-block text-outline">
              Fast
            </motion.span>
          </span>
        </motion.h1>

        {/* Sub-text */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="mt-8 max-w-xl font-sans text-base text-muted sm:text-lg"
        >
          Sejak 2017, tempat pemain ditempa dengan disiplin, semangat, dan
          kemahiran. Bersedia menyahut cabaran?
        </motion.p>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.85 }}
          className="mt-10"
        >
          <Button href="/portal">Sertai Pencarian Bakat →</Button>
        </motion.div>
      </div>

      {/* Penunjuk scroll */}
      <motion.a
        href="#tentang"
        aria-label="Scroll ke bawah"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-paper/60 hover:text-amber"
      >
        <motion.span
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          className="block"
        >
          <ChevronDown className="h-7 w-7" />
        </motion.span>
      </motion.a>
    </section>
  );
}
