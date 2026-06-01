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
type Item = { task: Task; submission: Submission };

// Tamat = lepas 11:59:59pm waktu Malaysia (+08:00) pada tarikh akhir.
const isPastDue = (due: string | null) =>
  !!due && Date.now() > new Date(`${due}T23:59:59+08:00`).getTime();

function statusOf(s: Submission): { label: string; cls: string } {
  if (!s) return { label: "Belum", cls: "border border-line text-muted" };
  if (s.status === "reviewed") return { label: "Disemak", cls: "bg-amber text-ink" };
  if (s.status === "revise") return { label: "Perlu Ulang", cls: "bg-paper/15 text-paper" };
  return { label: "Dihantar", cls: "bg-amber/15 text-amber" };
}

export default function PlayerTaskList({ items }: { items: Item[] }) {
  // Tugasan terkini (pertama) terbuka; yang lama kuncup.
  const [openId, setOpenId] = useState<string | null>(items[0]?.task.id ?? null);

  if (items.length === 0) {
    return (
      <p className="font-sans text-sm text-muted">
        Tiada tugasan buat masa ini. Jurulatih akan beri tugasan nanti.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {items.map(({ task, submission }) => {
        const open = openId === task.id;
        const st = statusOf(submission);
        return (
          <div key={task.id} className="overflow-hidden rounded-xl border border-line bg-bg-soft/50">
            <button
              type="button"
              onClick={() => setOpenId(open ? null : task.id)}
              className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left"
            >
              <span className="min-w-0 truncate font-sans text-sm font-semibold text-paper">
                {task.title}
              </span>
              <span className="flex shrink-0 items-center gap-2">
                {isPastDue(task.due_date) ? (
                  <span className="rounded-full border border-line px-2 py-0.5 font-sans text-[0.6rem] font-bold uppercase tracking-wide text-muted">
                    Tamat
                  </span>
                ) : (
                  <span className="rounded-full bg-amber/20 px-2 py-0.5 font-sans text-[0.6rem] font-bold uppercase tracking-wide text-amber">
                    Baru
                  </span>
                )}
                {submission?.late && (
                  <span className="rounded-full bg-orange-500/20 px-2 py-0.5 font-sans text-[0.6rem] font-semibold uppercase text-orange-400">
                    Lewat
                  </span>
                )}
                <span className={`rounded-full px-2.5 py-0.5 font-sans text-[0.65rem] font-semibold ${st.cls}`}>
                  {st.label}
                </span>
                <ChevronDown className={`h-4 w-4 text-muted transition-transform ${open ? "rotate-180" : ""}`} />
              </span>
            </button>
            {open && (
              <div className="border-t border-line px-4 py-4">
                {task.description && (
                  <p className="mb-2 font-sans text-sm text-muted">{task.description}</p>
                )}
                {task.due_date && (
                  <p className="mb-3 font-sans text-xs text-muted">Tarikh akhir: {task.due_date}</p>
                )}
                <TaskCard task={task} submission={submission} compact />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
