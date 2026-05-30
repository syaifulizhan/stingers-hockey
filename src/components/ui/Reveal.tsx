"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

// Scroll reveal: fade-up bila masuk viewport, sekali sahaja.
// `prefers-reduced-motion` dihormati melalui transition di globals.css
// (durasi dipaksa ~0 untuk pengguna reduced-motion).

type RevealProps = {
  children: ReactNode;
  className?: string;
  /** lengah (saat) untuk kesan stagger */
  delay?: number;
  as?: "div" | "li" | "section" | "article";
};

export default function Reveal({
  children,
  className = "",
  delay = 0,
  as = "div",
}: RevealProps) {
  const MotionTag = motion[as];
  return (
    <MotionTag
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </MotionTag>
  );
}
