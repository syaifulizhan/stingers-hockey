"use client";

import { useEffect, useState } from "react";

// Skrin pembuka (flash-in) bila app dibuka — logo + "Stingers Hockey".
// Ditunjuk SEKALI setiap sesi pelayar: pada muat seterusnya dalam sesi yang
// sama, ia disembunyikan serta-merta. Tiada skrip inline → tiada amaran React.
export default function SplashScreen() {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const hide = () => setShow(false);

    let seen = false;
    try {
      seen = !!sessionStorage.getItem("splashSeen");
      sessionStorage.setItem("splashSeen", "1");
    } catch {
      // sessionStorage tak tersedia — abaikan, tunjuk splash sahaja.
    }

    if (seen) {
      hide(); // sudah ditunjuk sesi ini → sembunyi segera
      return;
    }
    const t = setTimeout(hide, 2100); // sesi baru → main penuh
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
