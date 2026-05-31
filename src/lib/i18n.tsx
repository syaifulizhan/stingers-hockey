"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type Lang = "ms" | "en";

type Ctx = {
  lang: Lang;
  toggle: () => void;
  /** t("teks BM", "English text") → pilih ikut bahasa semasa */
  t: (ms: string, en: string) => string;
};

const LangCtx = createContext<Ctx | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>("ms");

  useEffect(() => {
    // Baca pilihan tersimpan selepas mount (elak hydration mismatch).
    const apply = () => {
      try {
        if (localStorage.getItem("lang") === "en") setLang("en");
      } catch {}
    };
    apply();
  }, []);

  const toggle = () =>
    setLang((l) => {
      const next: Lang = l === "ms" ? "en" : "ms";
      try {
        localStorage.setItem("lang", next);
      } catch {}
      return next;
    });

  const t = (ms: string, en: string) => (lang === "en" ? en : ms);

  return (
    <LangCtx.Provider value={{ lang, toggle, t }}>{children}</LangCtx.Provider>
  );
}

export function useLang(): Ctx {
  const c = useContext(LangCtx);
  // Fallback selamat (cth jika dipakai di luar provider) → kekal BM.
  if (!c) return { lang: "ms", toggle: () => {}, t: (ms) => ms };
  return c;
}
