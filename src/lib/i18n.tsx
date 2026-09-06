"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { kesanBahasa } from "@/lib/kesan-bahasa";

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
    // Dibaca selepas mount, bukan semasa render, supaya HTML pelayan dan
    // pelayaran pertama pelayar sepadan.
    //
    // Pilihan tersimpan MENGATASI pengesanan. Sebaik seseorang menyentuh pil
    // itu, kita tidak pernah meneka untuk mereka lagi — walaupun mereka
    // melancong dan zon waktunya berubah.
    try {
      const disimpan = localStorage.getItem("lang");
      if (disimpan === "en" || disimpan === "ms") {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLang(disimpan);
        return;
      }
    } catch {
      // Storan disekat; teruskan ke pengesanan.
    }

    // Lawatan pertama: teka dari peranti. Pelawat luar rantau yang bertutur
    // Melayu mendapat Bahasa Inggeris tanpa perlu mencari pil dahulu.
    // SENGAJA tidak disimpan — hanya pilihan manusia yang disimpan, jadi
    // tekaan ini kekal boleh diperbaiki dan tidak pernah terkunci.
    //
    // setState di dalam effect memang menyebabkan satu render tambahan, dan
    // di sini ia tidak dapat dielakkan: localStorage dan zon waktu hanya
    // wujud di pelayar, jadi render pertama MESTI sepadan dengan HTML
    // pelayan ("ms") sebelum boleh diperbetulkan. Membacanya semasa render
    // akan memecahkan hydration.
    setLang(kesanBahasa());
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
