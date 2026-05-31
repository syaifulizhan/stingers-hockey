"use client";

import { useState } from "react";
import Link from "next/link";

type Entry = { id: string; name: string };

export default function ReportPanel({ players }: { players: Entry[] }) {
  const [playerId, setPlayerId] = useState(players[0]?.id ?? "");

  if (players.length === 0) {
    return <p className="font-sans text-sm text-muted">Belum ada pemain.</p>;
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="flex-1">
        <label className="mb-1.5 block font-sans text-xs text-muted">Pemain</label>
        <select
          value={playerId}
          onChange={(e) => setPlayerId(e.target.value)}
          className="w-full rounded-lg border border-line bg-ink px-3 py-2 font-sans text-sm text-paper outline-none focus:border-amber"
        >
          {players.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>
      <Link
        href={`/portal/report/${playerId}`}
        className="inline-flex items-center justify-center rounded-full bg-amber px-6 py-2.5 font-sans text-sm font-semibold uppercase tracking-wider text-ink transition-colors hover:bg-amber-deep"
      >
        Generate Report
      </Link>
    </div>
  );
}
