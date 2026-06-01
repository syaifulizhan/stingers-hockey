"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, ChevronDown } from "lucide-react";

const inputCls =
  "w-full rounded-lg border border-line bg-ink px-3 py-2 font-sans text-sm text-paper outline-none focus:border-amber";

type Member = { clerk_user_id: string; full_name: string | null };
type Task = {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  assigned_to: string | null;
};
type Summary = {
  target: number;
  submitted: number;
  reviewed: number;
  revise: number;
  late: number;
};

export default function TaskAdminItem({
  task,
  members,
  assigneeName,
  summary = null,
}: {
  task: Task;
  members: Member[];
  assigneeName: string;
  summary?: Summary | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? "");
  const [dueDate, setDueDate] = useState(task.due_date ?? "");
  const [assignedTo, setAssignedTo] = useState(task.assigned_to ?? "");
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (title.trim() === "") return;
    setBusy(true);
    try {
      const res = await fetch("/api/portal/coach/task", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: task.id, title, description, dueDate, assignedTo }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setBusy(false);
      window.alert("Gagal kemas kini.");
      return;
    }
    setBusy(false);
    setEditing(false);
    router.refresh();
  };

  const del = async () => {
    if (!window.confirm(`Padam tugasan "${task.title}"? Hantaran ahli untuk tugasan ini juga akan terpadam.`)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/portal/coach/task?id=${task.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
    } catch {
      setBusy(false);
      window.alert("Gagal padam.");
      return;
    }
    router.refresh();
  };

  if (editing) {
    return (
      <div className="flex flex-col gap-2 rounded-lg border border-line bg-bg-soft/50 p-3">
        <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Tajuk tugasan" />
        <textarea
          className={`${inputCls} resize-y`}
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Penerangan (pilihan)"
        />
        <div className="grid gap-2 sm:grid-cols-2">
          <input type="date" className={inputCls} value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          <select className={inputCls} value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)}>
            <option value="">Semua ahli</option>
            {members.map((m) => (
              <option key={m.clerk_user_id} value={m.clerk_user_id}>
                {m.full_name || "(tanpa nama)"}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={save}
            disabled={busy}
            className="rounded-full bg-amber px-4 py-1.5 font-sans text-xs font-semibold uppercase tracking-wider text-ink hover:bg-amber-deep disabled:opacity-60"
          >
            Simpan
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="rounded-full border border-line px-4 py-1.5 font-sans text-xs text-paper hover:border-amber"
          >
            Batal
          </button>
        </div>
      </div>
    );
  }

  const stats = summary
    ? [
        { label: "Hantar", value: `${summary.submitted}/${summary.target}` },
        { label: "Disemak", value: `${summary.reviewed}/${summary.target}` },
        { label: "Minta Ulang", value: `${summary.revise}/${summary.target}` },
        { label: "Lewat", value: `${summary.late}/${summary.target}` },
      ]
    : [];

  return (
    <div className="rounded-lg border border-line bg-bg-soft/40">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left font-sans text-sm text-paper/90"
      >
        <span className="min-w-0 truncate">
          {task.title}
          <span className="text-muted">
            {" "}
            → {assigneeName}
            {task.due_date ? ` · akhir ${task.due_date}` : ""}
          </span>
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-muted transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="border-t border-line px-3 py-3">
          {summary && (
            <div className="mb-3 grid grid-cols-4 gap-2">
              {stats.map((s) => (
                <div key={s.label} className="rounded-lg bg-ink/50 py-2 text-center">
                  <div className="font-sans text-sm font-bold text-amber tabular-nums">{s.value}</div>
                  <div className="font-sans text-[0.55rem] uppercase tracking-wide text-muted">
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          )}
          {task.description && (
            <p className="mb-3 font-sans text-xs text-muted">{task.description}</p>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="inline-flex items-center gap-1 rounded-full border border-line px-3 py-1 font-sans text-xs font-semibold text-paper transition-colors hover:border-amber hover:text-amber"
            >
              <Pencil className="h-3.5 w-3.5" /> Edit
            </button>
            <button
              type="button"
              onClick={del}
              className="inline-flex items-center gap-1 rounded-full border border-line px-3 py-1 font-sans text-xs font-semibold text-muted transition-colors hover:border-red-500/50 hover:text-red-400"
            >
              <Trash2 className="h-3.5 w-3.5" /> Padam
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
