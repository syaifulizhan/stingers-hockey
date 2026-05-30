"use client";

import { useEffect, useState } from "react";

// Skrin pembuka (flash-in) bila app dibuka — logo + "Stingers Hockey",
// kemudian pudar masuk ke laman. Animasi dikendali CSS (mandiri), jadi
// kandungan tetap boleh diakses walaupun JS lambat/gagal. JS cuma
// mengeluarkan node dari DOM selepas animasi tamat.
export default function SplashScreen() {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setShow(false), 2100);
    return () => clearTimeout(t);
  }, []);

  if (!show) return null;

  return (
    <div
      className="splash pointer-events-none fixed inset-0 z-[100] flex flex-col items-center justify-center gap-6 bg-ink"
      aria-hidden="true"
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- splash kecil, fallback ke ikon jenama bila logo belum diimport */}
      <img
        src="/images/logo.png"
        alt=""
        className="splash-logo h-24 w-24 object-contain"
        onError={(e) => {
          const img = e.currentTarget;
          if (!img.src.endsWith("/icon-512.png")) img.src = "/icon-512.png";
        }}
      />
      <div className="text-center">
        <h1 className="splash-name display text-4xl leading-none text-paper sm:text-5xl">
          Stingers
          <br />
          <span className="text-amber">Hockey</span>
        </h1>
        <div className="splash-line mx-auto mt-5 h-0.5 w-24 bg-amber" />
        <p className="splash-tag mt-5 font-sans text-[0.7rem] uppercase tracking-[0.3em] text-muted">
          Strike Hard. Strike Fast.
        </p>
      </div>
    </div>
  );
}
