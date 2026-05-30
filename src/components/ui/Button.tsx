"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

type ButtonProps = {
  children: ReactNode;
  href?: string;
  type?: "button" | "submit";
  variant?: "amber" | "outline";
  fullWidth?: boolean;
  className?: string;
  disabled?: boolean;
  ariaLabel?: string;
};

const base =
  "inline-flex items-center justify-center gap-2 rounded-full px-7 py-3 font-sans text-sm font-semibold uppercase tracking-wider transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber disabled:opacity-60 disabled:pointer-events-none";

const variants = {
  amber: "bg-amber text-ink hover:bg-amber-deep",
  outline:
    "border border-line text-paper hover:border-amber hover:text-amber bg-transparent",
};

// Lift -2px + amber glow on hover (honoured-by reduced-motion via globals)
const motionProps = {
  whileHover: { y: -2, boxShadow: "0 8px 24px -6px rgba(245,180,0,0.45)" },
  whileTap: { y: 0, scale: 0.98 },
  transition: { type: "spring" as const, stiffness: 400, damping: 25 },
};

export default function Button({
  children,
  href,
  type = "button",
  variant = "amber",
  fullWidth = false,
  className = "",
  disabled = false,
  ariaLabel,
}: ButtonProps) {
  const classes = `${base} ${variants[variant]} ${
    fullWidth ? "w-full" : ""
  } ${className}`;

  if (href) {
    return (
      <motion.a
        href={href}
        aria-label={ariaLabel}
        className={classes}
        {...motionProps}
      >
        {children}
      </motion.a>
    );
  }

  return (
    <motion.button
      type={type}
      disabled={disabled}
      aria-label={ariaLabel}
      className={classes}
      {...motionProps}
    >
      {children}
    </motion.button>
  );
}
