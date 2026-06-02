"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";

export type TaskException = { uid: string; note: string };
type Member = { clerk_user_id: string; full_name: string | null };

const inputCls =
  "w-full rounded-lg border border-line bg-ink px-3 py-2 font-sans text-sm text-paper placeholder:text-muted/60 outline-none focus:border-amber";

// Editor pengecualian untuk tugasan umum: pilih ahli + tulis arahan/limit khas.
// Ahli dalam senarai ini tetap hantar ke tugasan yang sama, cuma keperluan beza.
export default function TaskExceptionsEditor({
  members,
  value,
  onChange,
}: {
  members: Member[];
  value: TaskException[];
  onChange: (next: TaskException[]) => void;
}) {
  const [uid, setUid] = useState("");
  const [note, setNote] = useState("");

  const nameOf = (id: string) =>
    members.find((m) => m.clerk_user_id === id)?.full_name || "(tanpa nama)";
  // Ahli yang belum ada dalam senarai pengecualian.
  const available = members.filter((m) => !value.some((e) => e.uid === m.clerk_user_id));

  const add = () => {
    if (!uid || note.trim() === "") return;
    if (value.some((e) => e.uid === uid)) return;
    onChange([...value, { uid, note: note.trim() }]);
    setUid("");
    setNote("");
  };
  const remove = (id: string) => onChange(value.filter((e) => e.uid !== id));

  return (
    <div>
      <label className="mb-1.5 block font-sans text-xs text-muted">
        Pengecualian — ahli dengan arahan/limit berbeza (pilihan)
      </label>

      {/* Senarai pengecualian sedia ada */}
      {value.length > 0 && (
        <ul className="mb-2 flex flex-col gap-1.5">
          {value.map((e) => (
            <li
              key={e.uid}
              className="flex items-center gap-2 rounded-lg border border-line bg-ink/50 px-3 py-2"
            >
              <span className="shrink-0 font-sans text-xs font-semibold text-amber">
                {nameOf(e.uid)}
              </span>
              <span className="min-w-0 flex-1 truncate font-sans text-xs text-paper/90">
                {e.note}
              </span>
              <button
                type="button"
                onClick={() => remove(e.uid)}
                aria-label="Buang pengecualian"
                className="shrink-0 rounded-full p-1 text-muted hover:text-amber"
              >
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Baris tambah pengecualian baharu */}
      {available.length > 0 ? (
        <div className="flex flex-col gap-2 sm:flex-row">
          <select
            className={`${inputCls} sm:w-44`}
            value={uid}
            onChange={(ev) => setUid(ev.target.value)}
          >
            <option value="">— Pilih ahli —</option>
            {available.map((m) => (
              <option key={m.clerk_user_id} value={m.clerk_user_id}>
                {m.full_name || "(tanpa nama)"}
              </option>
            ))}
          </select>
          <input
            className={inputCls}
            placeholder="Arahan khas (cth: Larian 1KM sahaja)"
            value={note}
            onChange={(ev) => setNote(ev.target.value)}
            onKeyDown={(ev) => {
              if (ev.key === "Enter") {
                ev.preventDefault();
                add();
              }
            }}
          />
          <button
            type="button"
            onClick={add}
            disabled={!uid || note.trim() === ""}
            className="inline-flex shrink-0 items-center justify-center gap-1 rounded-lg border border-line px-3 py-2 font-sans text-xs font-semibold text-paper transition-colors hover:border-amber hover:text-amber disabled:opacity-50"
          >
            <Plus className="h-4 w-4" /> Tambah
          </button>
        </div>
      ) : (
        <p className="font-sans text-xs text-muted">Semua ahli telah ditetapkan.</p>
      )}
    </div>
  );
}
