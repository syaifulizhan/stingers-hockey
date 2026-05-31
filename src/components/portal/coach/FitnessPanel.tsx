"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FITNESS_METRICS, FITNESS_OCCASIONS } from "@/lib/fitness";
import { memberName } from "@/lib/names";
import FitnessSummary from "@/components/portal/FitnessSummary";

const inputCls =
  "w-full rounded-lg border border-line bg-ink px-3 py-2 font-sans text-sm text-paper outline-none focus:border-amber";

type Member = { clerk_user_id: string; full_name: string | null; display_name?: string | null };
type TestRow = { tested_on: string; results: Record<string, number> };

export default function FitnessPanel({
  members,
  history,
}: {
  members: Member[];
  // Sejarah ujian ikut pemain (untuk PB/graf).
  history: Record<string, TestRow[]>;
}) {
  const router = useRouter();
  const [playerId, setPlayerId] = useState(members[0]?.clerk_user_id ?? "");
  const [occasion, setOccasion] = useState<string>(FITNESS_OCCASIONS[0]);
  const [date, setDate] = useState("");
  const [vals, setVals] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const playerHistory = history[playerId] ?? [];

  const save = async () => {
    if (!playerId) return;
    const results: Record<string, number> = {};
    for (const m of FITNESS_METRICS) {
      const raw = vals[m.key];
      if (raw !== undefined && raw !== "") {
        const n = Number(raw);
        if (!Number.isNaN(n) && n >= 0) results[m.key] = n;
      }
    }
    if (Object.keys(results).length === 0) {
      setMsg("Sila isi sekurang-kurangnya satu ujian.");
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/portal/coach/fitness", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: playerId, occasion, testedOn: date, results }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal");
      setMsg("✓ Ujian disimpan.");
      setVals({});
      router.refresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Gagal simpan.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-4 rounded-xl border border-line bg-bg-soft/50 p-5">
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="mb-1.5 block font-sans text-xs text-muted">Pemain</label>
            <select className={inputCls} value={playerId} onChange={(e) => setPlayerId(e.target.value)}>
              {members.map((m) => (
                <option key={m.clerk_user_id} value={m.clerk_user_id}>
                  {memberName(m.full_name, m.display_name)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block font-sans text-xs text-muted">Sesi ujian</label>
            <select className={inputCls} value={occasion} onChange={(e) => setOccasion(e.target.value)}>
              {FITNESS_OCCASIONS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block font-sans text-xs text-muted">Tarikh (pilihan)</label>
            <input type="date" className={inputCls} value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {FITNESS_METRICS.map((m) => (
            <div key={m.key} className="flex items-center gap-2">
              <label className="w-32 shrink-0 font-sans text-xs text-paper/90">
                {m.label} <span className="text-muted">({m.unit})</span>
              </label>
              <input
                type="number"
                inputMode="decimal"
                min={0}
                step={m.step}
                value={vals[m.key] ?? ""}
                onChange={(e) => setVals((s) => ({ ...s, [m.key]: e.target.value }))}
                placeholder="—"
                className={inputCls}
              />
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={save}
            disabled={busy || !playerId}
            className="rounded-full bg-amber px-6 py-2.5 font-sans text-sm font-semibold uppercase tracking-wider text-ink transition-colors hover:bg-amber-deep disabled:opacity-60"
          >
            {busy ? "Menyimpan…" : "Simpan Ujian"}
          </button>
          {msg && <span className="font-sans text-xs text-paper/80">{msg}</span>}
        </div>
      </div>

      {/* PB + graf pemain terpilih (untuk pemilihan tournament) */}
      <div>
        <h4 className="mb-3 font-sans text-xs font-semibold uppercase tracking-wider text-muted">
          Rekod Peribadi & Peningkatan
        </h4>
        <FitnessSummary history={playerHistory} />
      </div>
    </div>
  );
}
