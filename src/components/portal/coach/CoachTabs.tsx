"use client";

import { useState } from "react";

type Tab = { id: string; label: string; content: React.ReactNode };

// Tab navigasi panel jurulatih — elak skrol panjang.
// Kandungan dirender pelayan (server) & dihantar sebagai prop; tab tidak aktif
// disembunyikan (bukan dipadam) supaya borang separuh isi tak hilang.
export default function CoachTabs({ tabs }: { tabs: Tab[] }) {
  const [active, setActive] = useState(tabs[0]?.id ?? "");

  return (
    <div className="mt-6">
      <div className="sticky top-0 z-30 -mx-6 flex gap-1 overflow-x-auto border-b border-line bg-ink/95 px-6 py-2.5 backdrop-blur">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActive(t.id)}
            className={`shrink-0 whitespace-nowrap rounded-full px-4 py-2 font-sans text-sm font-semibold transition-colors ${
              active === t.id
                ? "bg-amber text-ink"
                : "text-paper/80 hover:bg-amber/10 hover:text-amber"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tabs.map((t) => (
          <div key={t.id} className={active === t.id ? "" : "hidden"}>
            {t.content}
          </div>
        ))}
      </div>
    </div>
  );
}
