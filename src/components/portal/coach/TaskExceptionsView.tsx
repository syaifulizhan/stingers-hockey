"use client";

import { useState } from "react";

type Item = { name: string; note: string };

// Paparan arahan khas (pengecualian) untuk JURULATIH:
//   • seorang  → terus papar nama + nota
//   • berganda → dropdown pilih nama, papar notanya
export default function TaskExceptionsView({ exceptions }: { exceptions: Item[] }) {
  const [sel, setSel] = useState(0);
  if (exceptions.length === 0) return null;

  const single = exceptions.length === 1;
  const cur = exceptions[Math.min(sel, exceptions.length - 1)];

  return (
    <div className="rounded-lg border border-amber/40 bg-amber/10 px-3 py-2">
      <div className="flex items-center justify-between gap-2">
        <p className="font-sans text-[0.7rem] font-bold uppercase tracking-wide text-amber">
          Arahan khas{single ? "" : ` (${exceptions.length})`}
        </p>
        {!single && (
          <select
            value={sel}
            onChange={(e) => setSel(Number(e.target.value))}
            className="max-w-[55%] truncate rounded-md border border-line bg-ink px-2 py-1 font-sans text-xs text-paper outline-none focus:border-amber"
          >
            {exceptions.map((e, i) => (
              <option key={i} value={i}>
                {e.name}
              </option>
            ))}
          </select>
        )}
      </div>
      <p className="mt-1 font-sans text-sm text-paper/90">
        <span className="font-semibold text-amber">{cur.name}:</span> {cur.note}
      </p>
    </div>
  );
}
