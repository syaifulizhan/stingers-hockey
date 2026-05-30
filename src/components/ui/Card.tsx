"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

type CardProps = {
  children: ReactNode;
  className?: string;
  /** aktifkan hover lift -6px + border amber */
  interactive?: boolean;
};

export default function Card({
  children,
  className = "",
  interactive = true,
}: CardProps) {
  return (
    <motion.div
      whileHover={interactive ? { y: -6, borderColor: "var(--amber)" } : undefined}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className={`rounded-2xl border border-line bg-bg-soft/60 shadow-[0_2px_24px_-12px_rgba(0,0,0,0.8)] ${className}`}
    >
      {children}
    </motion.div>
  );
}
