"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";

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

type Stat = { submitted: number; total: number; pct: number };

export default function TaskAdminItem({
  task,
  members,
  assigneeName,
  stat = null,
}: {
  task: Task;
  members: Member[];
  assigneeName: string;
  stat?: Stat | null;
}) {
  const router = useRouter();
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

  return (
    <div className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 font-sans text-sm text-paper/80 hover:bg-bg-soft/50">
      <span className="min-w-0">
        • {task.title}{" "}
        <span className="text-muted">
          → {assigneeName}
          {task.due_date ? ` · akhir ${task.due_date}` : ""}
        </span>
        {stat && (
          <span
            className={`ml-2 rounded-full px-2 py-0.5 font-sans text-[0.65rem] font-semibold ${
              stat.pct >= 100
                ? "bg-amber text-ink"
                : stat.pct > 0
                  ? "bg-amber/20 text-amber"
                  : "bg-paper/10 text-paper/60"
            }`}
            title="Penghantaran ahli"
          >
            {stat.submitted}/{stat.total} hantar ({stat.pct}%)
          </span>
        )}
      </span>
      <span className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={() => setEditing(true)}
          aria-label="Edit"
          className="rounded-md p-1.5 text-muted transition-colors hover:bg-amber/10 hover:text-amber"
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={del}
          aria-label="Padam"
          className="rounded-md p-1.5 text-muted transition-colors hover:bg-amber/10 hover:text-amber"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </span>
    </div>
  );
}
