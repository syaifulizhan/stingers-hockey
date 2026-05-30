"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { navLinks } from "@/lib/site";

export default function Navigation() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  // Background solid + blur bila scroll > 40px
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Kunci scroll body bila menu mobile terbuka
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        scrolled
          ? "border-b border-line bg-ink/80 backdrop-blur-md"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <nav
        aria-label="Navigasi utama"
        className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6"
      >
        {/* Logo */}
        <a href="#top" className="flex items-center gap-3" aria-label="Stingers Hockey — ke atas">
          {/* eslint-disable-next-line @next/next/no-img-element -- logo statik kecil, fallback teks bila tiada */}
          <img
            src="/images/logo.png"
            alt="Logo Stingers Hockey"
            className="h-9 w-9 object-contain"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
          <span className="display flex flex-col text-xl leading-none text-paper">
            <span>Stingers<span className="text-amber">.</span></span>
            <span className="text-amber">Hockey</span>
          </span>
        </a>

        {/* Pautan desktop */}
        <ul className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="font-sans text-sm font-medium uppercase tracking-wide text-paper/80 transition-colors hover:text-amber"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        {/* CTA desktop */}
        <a
          href="#daftar"
          className="hidden rounded-full bg-amber px-5 py-2.5 font-sans text-sm font-semibold uppercase tracking-wider text-ink transition-colors hover:bg-amber-deep md:inline-flex"
        >
          Sertai Skuad
        </a>

        {/* Hamburger mobile */}
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Buka menu"
          className="text-paper md:hidden"
        >
          <Menu className="h-7 w-7" />
        </button>
      </nav>

      {/* Menu mobile (slide dari kanan) */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-40 bg-black/60 md:hidden"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 34 }}
              className="fixed inset-y-0 right-0 z-50 flex w-72 flex-col gap-2 border-l border-line bg-bg-soft p-6 md:hidden"
            >
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Tutup menu"
                className="mb-6 self-end text-paper"
              >
                <X className="h-7 w-7" />
              </button>
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="display py-2 text-2xl text-paper transition-colors hover:text-amber"
                >
                  {link.label}
                </a>
              ))}
              <a
                href="#daftar"
                onClick={() => setOpen(false)}
                className="mt-4 rounded-full bg-amber px-5 py-3 text-center font-sans text-sm font-semibold uppercase tracking-wider text-ink"
              >
                Sertai Skuad
              </a>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
