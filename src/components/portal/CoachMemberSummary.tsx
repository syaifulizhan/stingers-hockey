"use client";

import { useState } from "react";
import SummaryChips from "@/components/portal/SummaryChips";
import type { PlayerSummary } from "@/lib/player-summaries";

export default function CoachMemberSummary({ players }: { players: PlayerSummary[] }) {
  const [id, setId] = useState(players[0]?.id ?? "");

  if (players.length === 0) {
    return <p className="font-sans text-sm text-muted">Belum ada ahli untuk dipaparkan.</p>;
  }

  const selected = players.find((p) => p.id === id) ?? players[0];

  return (
    <div className="flex flex-col gap-3">
      <select
        value={id}
        onChange={(e) => setId(e.target.value)}
        className="w-full max-w-sm rounded-lg border border-line bg-ink px-3 py-2 font-sans text-sm text-paper outline-none focus:border-amber"
      >
        {players.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
      <SummaryChips chips={selected.chips} />
    </div>
  );
}
