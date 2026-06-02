"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import TaskCard from "@/components/portal/TaskCard";

type Task = {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
};
type Submission = {
  content: string | null;
  status: string;
  media_url: string | null;
  late?: boolean;
} | null;
type Item = { task: Task; submission: Submission; note?: string | null };

// Tamat = lepas 11:59:59pm waktu Malaysia (+08:00) pada tarikh akhir.
const isPastDue = (due: string | null) =>
  !!due && Date.now() > new Date(`${due}T23:59:59+08:00`).getTime();

function statusOf(s: Submission): { label: string; cls: string } {
  if (!s) return { label: "Belum", cls: "border border-line text-muted" };
  if (s.status === "reviewed") return { label: "Disemak", cls: "bg-amber text-ink" };
  if (s.status === "revise") return { label: "Perlu Ulang", cls: "bg-paper/15 text-paper" };
  return { label: "Dihantar", cls: "bg-amber/15 text-amber" };
}

export default function PlayerTaskList({
  items,
  readOnly = false,
}: {
  items: Item[];
  readOnly?: boolean;
}) {
  // Task BARU (belum tamat) terbuka; task TAMAT kuncup. Setiap satu boleh toggle.
  const [openIds, setOpenIds] = useState<Set<string>>(
    () => new Set(items.filter((it) => !isPastDue(it.task.due_date)).map((it) => it.task.id))
  );
  const toggle = (id: string) =>
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  if (items.length === 0) {
    return (
      <p className="font-sans text-sm text-muted">
        Tiada tugasan buat masa ini. Jurulatih akan beri tugasan nanti.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {items.map(({ task, submission, note }) => {
        const open = openIds.has(task.id);
        const past = isPastDue(task.due_date);
        const st = statusOf(submission);
        return (
          <div key={task.id} className="overflow-hidden rounded-xl border border-line bg-bg-soft/50">
            <button
              type="button"
              onClick={() => toggle(task.id)}
              className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left"
            >
              <span className="min-w-0 truncate font-sans text-sm font-semibold text-paper">
                {task.title}
              </span>
              <span className="flex shrink-0 items-center gap-2">
                {past ? (
                  <span className="rounded-full border border-line px-2 py-0.5 font-sans text-[0.6rem] font-bold uppercase tracking-wide text-muted">
                    Tamat
                  </span>
                ) : (
                  <span className="rounded-full bg-amber/20 px-2 py-0.5 font-sans text-[0.6rem] font-bold uppercase tracking-wide text-amber">
                    Baru
                  </span>
                )}
                {note && (
                  <span className="rounded-full bg-amber px-2 py-0.5 font-sans text-[0.6rem] font-bold uppercase tracking-wide text-ink">
                    Khas
                  </span>
                )}
                {!readOnly && submission?.late && (
                  <span className="rounded-full bg-orange-500/20 px-2 py-0.5 font-sans text-[0.6rem] font-semibold uppercase text-orange-400">
                    Lewat
                  </span>
                )}
                {!readOnly && (
                  <span className={`rounded-full px-2.5 py-0.5 font-sans text-[0.65rem] font-semibold ${st.cls}`}>
                    {st.label}
                  </span>
                )}
                <ChevronDown className={`h-4 w-4 text-muted transition-transform ${open ? "rotate-180" : ""}`} />
              </span>
            </button>
            {open && (
              <div className="border-t border-line px-4 py-4">
                {/* Arahan/limit khas untuk ahli ini (pengecualian) */}
                {note && (
                  <div className="mb-3 rounded-lg border border-amber/40 bg-amber/10 px-3 py-2">
                    <p className="font-sans text-[0.7rem] font-bold uppercase tracking-wide text-amber">
                      Khas untuk anda
                    </p>
                    <p className="mt-0.5 font-sans text-sm text-paper/90">{note}</p>
                  </div>
                )}
                {task.description && (
                  <p className="mb-2 font-sans text-sm text-muted">{task.description}</p>
                )}
                {task.due_date && (
                  <p className="mb-3 font-sans text-xs text-muted">Tarikh akhir: {task.due_date}</p>
                )}
                {/* Coach/admin: baca sahaja — tiada borang hantar. */}
                {!readOnly && <TaskCard task={task} submission={submission} compact />}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
