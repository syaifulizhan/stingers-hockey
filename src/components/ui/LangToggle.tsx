"use client";

import { useLang } from "@/lib/i18n";

// Suis bahasa: ON (kanan, amber) = English; OFF (kiri) = Malay.
export default function LangToggle() {
  const { lang, toggle } = useLang();
  const en = lang === "en";

  return (
    <button
      type="button"
      onClick={toggle}
      role="switch"
      aria-checked={en}
      aria-label={en ? "Switch to Malay" : "Tukar ke English"}
      title={en ? "English (tekan untuk BM)" : "Malay (tekan untuk EN)"}
      className="inline-flex items-center gap-2 font-sans text-xs font-semibold uppercase tracking-wide"
    >
      <span className={en ? "text-muted" : "text-amber"}>BM</span>
      <span className="relative h-5 w-9 rounded-full bg-line transition-colors">
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-amber transition-all duration-200 ${
            en ? "left-[1.125rem]" : "left-0.5"
          }`}
        />
      </span>
      <span className={en ? "text-amber" : "text-muted"}>EN</span>
    </button>
  );
}
