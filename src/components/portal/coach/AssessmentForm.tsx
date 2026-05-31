"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ASSESSMENT_METRICS,
  ASSESSMENT_LABELS,
  ASSESSMENT_TYPES,
  type AssessmentType,
} from "@/lib/assessments";

const inputCls =
  "w-full rounded-lg border border-line bg-ink px-3 py-2 font-sans text-sm text-paper outline-none focus:border-amber";

type Member = { clerk_user_id: string; full_name: string | null };

export default function AssessmentForm({
  members,
  latest,
}: {
  members: Member[];
  // Skor terkini ikut `${userId}:${type}` untuk pra-isi slider.
  latest: Record<string, Record<string, number>>;
}) {
  const router = useRouter();
  const [playerId, setPlayerId] = useState(members[0]?.clerk_user_id ?? "");
  const [type, setType] = useState<AssessmentType>("skill_field");
  const [date, setDate] = useState("");
  const [scores, setScores] = useState<Record<string, number>>({});
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const metrics = ASSESSMENT_METRICS[type];

  // Pra-isi slider dengan skor terkini pemain (atau 5 jika belum ada).
  const prefill = useMemo(() => {
    const prev = latest[`${playerId}:${type}`] ?? {};
    const init: Record<string, number> = {};
    for (const m of metrics) init[m.key] = prev[m.key] ?? 5;
    return init;
  }, [playerId, type, latest, metrics]);

  useEffect(() => {
    setScores(prefill);
    setMsg(null);
  }, [prefill]);

  const save = async () => {
    if (!playerId) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/portal/coach/assessment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUserId: playerId,
          type,
          assessedOn: date,
          scores,
          note,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal");
      setMsg("✓ Penilaian disimpan.");
      setNote("");
      router.refresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Gagal simpan.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-line bg-bg-soft/50 p-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className="mb-1.5 block font-sans text-xs text-muted">Pemain</label>
          <select className={inputCls} value={playerId} onChange={(e) => setPlayerId(e.target.value)}>
            {members.map((m) => (
              <option key={m.clerk_user_id} value={m.clerk_user_id}>
                {m.full_name || "(tanpa nama)"}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block font-sans text-xs text-muted">Jenis penilaian</label>
          <select className={inputCls} value={type} onChange={(e) => setType(e.target.value as AssessmentType)}>
            {ASSESSMENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {ASSESSMENT_LABELS[t]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block font-sans text-xs text-muted">Tarikh (pilihan)</label>
          <input type="date" className={inputCls} value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {metrics.map((m) => {
          const v = scores[m.key] ?? 5;
          return (
            <div key={m.key} className="flex items-center gap-3">
              <span className="w-32 shrink-0 font-sans text-xs text-paper/90">{m.label}</span>
              <input
                type="range"
                min={1}
                max={10}
                step={1}
                value={v}
                onChange={(e) =>
                  setScores((s) => ({ ...s, [m.key]: Number(e.target.value) }))
                }
                className="h-1.5 flex-1 cursor-pointer accent-amber"
              />
              <span className="w-7 shrink-0 text-right font-sans text-sm font-semibold tabular-nums text-amber">
                {v}
              </span>
            </div>
          );
        })}
      </div>

      <textarea
        className={`${inputCls} resize-y`}
        rows={2}
        placeholder="Nota (pilihan)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={busy || !playerId}
          className="rounded-full bg-amber px-6 py-2.5 font-sans text-sm font-semibold uppercase tracking-wider text-ink transition-colors hover:bg-amber-deep disabled:opacity-60"
        >
          {busy ? "Menyimpan…" : "Simpan Penilaian"}
        </button>
        {msg && <span className="font-sans text-xs text-paper/80">{msg}</span>}
      </div>
    </div>
  );
}
