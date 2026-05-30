"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const inputCls =
  "w-full rounded-lg border border-line bg-ink px-4 py-3 font-sans text-sm text-paper placeholder:text-muted/60 outline-none focus:border-amber";

type Member = { clerk_user_id: string; full_name: string | null };

export default function TaskForm({ members }: { members: Member[] }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (title.trim() === "") {
      setError("Tajuk diperlukan.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/portal/coach/task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, dueDate, assignedTo }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => null);
        throw new Error(j?.error || "Gagal cipta tugasan.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal.");
      setSaving(false);
      return;
    }
    setTitle("");
    setDescription("");
    setDueDate("");
    setAssignedTo("");
    setSaving(false);
    router.refresh();
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-3 rounded-xl border border-line bg-bg-soft/50 p-5">
      <input
        className={inputCls}
        placeholder="Tajuk tugasan (cth: Latihan dribbling 30 minit)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <textarea
        rows={2}
        className={`${inputCls} resize-y`}
        placeholder="Penerangan (pilihan)…"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block font-sans text-xs text-muted">Tarikh akhir (pilihan)</label>
          <input
            type="date"
            className={inputCls}
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1.5 block font-sans text-xs text-muted">Tugaskan kepada</label>
          <select
            className={inputCls}
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
          >
            <option value="">Semua ahli</option>
            {members.map((m) => (
              <option key={m.clerk_user_id} value={m.clerk_user_id}>
                {m.full_name || "(tanpa nama)"}
              </option>
            ))}
          </select>
        </div>
      </div>
      {error && <p className="font-sans text-xs text-amber">{error}</p>}
      <button
        type="submit"
        disabled={saving}
        className="self-start rounded-full bg-amber px-6 py-2.5 font-sans text-sm font-semibold uppercase tracking-wider text-ink transition-colors hover:bg-amber-deep disabled:opacity-60"
      >
        {saving ? "Mencipta…" : "Beri Tugasan"}
      </button>
    </form>
  );
}
