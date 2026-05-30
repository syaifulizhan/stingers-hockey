"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import Honeycomb from "@/components/ui/Honeycomb";
import Button from "@/components/ui/Button";

// Dua foto pemain bersilih ganti (crossfade) sebagai latar.
const heroImages = ["/images/hero-player.jpg", "/images/hero-player2.jpg"];

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
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(
      () => setIdx((i) => (i + 1) % heroImages.length),
      6000
    );
    return () => clearInterval(t);
  }, []);

  return (
    <section
      id="top"
      className="relative flex min-h-screen items-center overflow-hidden"
    >
      {/* Latar foto pemain — crossfade antara dua foto (img biasa = kukuh prod) */}
      {heroImages.map((src, i) => (
        // eslint-disable-next-line @next/next/no-img-element -- latar hero penuh, perlu render konsisten prod
        <img
          key={src}
          src={src}
          alt=""
          aria-hidden="true"
          className={`absolute inset-0 -z-20 h-full w-full object-cover transition-opacity duration-[1500ms] ${
            i === idx ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}
      {/* Gradient overlay gelap — di sisi & bawah supaya teks jelas */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink via-ink/85 to-ink/45" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-ink via-ink/70 to-transparent" />
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
