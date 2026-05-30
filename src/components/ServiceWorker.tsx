"use client";

import { useEffect } from "react";

// Daftar service worker supaya laman boleh dipasang (PWA) & berfungsi luar talian.
export default function ServiceWorker() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch((err) => {
        console.error("[sw] gagal daftar:", err);
      });
    };

    // Daftar selepas load supaya tidak mengganggu render pertama.
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });
  }, []);

  return null;
}
