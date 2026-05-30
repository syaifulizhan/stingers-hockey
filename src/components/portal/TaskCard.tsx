"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Clock } from "lucide-react";

type Task = {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
};

type Submission = {
  content: string | null;
  status: string;
} | null;

export default function TaskCard({
  task,
  submission,
}: {
  task: Task;
  submission: Submission;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState(submission?.content ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitted = !!submission;

  const save = async () => {
    setError(null);
    if (content.trim() === "") {
      setError("Sila tulis sesuatu.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/portal/submission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId: task.id, content }),
      });
      if (!res.ok) throw new Error("Gagal menghantar.");
    } catch {
      setError("Gagal menghantar. Cuba lagi.");
      setSaving(false);
      return;
    }
    setSaving(false);
    setOpen(false);
    router.refresh();
  };

  return (
    <div className="rounded-xl border border-line bg-bg-soft/50 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-sans text-base font-semibold text-paper">
            {task.title}
          </h3>
          {task.description && (
            <p className="mt-1 font-sans text-sm text-muted">
              {task.description}
            </p>
          )}
          {task.due_date && (
            <p className="mt-2 inline-flex items-center gap-1.5 font-sans text-xs text-muted">
              <Clock className="h-3.5 w-3.5" />
              Tarikh akhir: {task.due_date}
            </p>
          )}
        </div>
        {submitted ? (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber/15 px-3 py-1 font-sans text-xs font-semibold text-amber">
            <CheckCircle2 className="h-3.5 w-3.5" /> Dihantar
          </span>
        ) : (
          <span className="shrink-0 rounded-full border border-line px-3 py-1 font-sans text-xs text-muted">
            Belum
          </span>
        )}
      </div>

      {open ? (
        <div className="mt-4">
          <textarea
            rows={3}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Tulis apa yang anda buat (cth: 30 minit dribbling, 50 push-up)…"
            className="w-full rounded-lg border border-line bg-ink px-4 py-3 font-sans text-sm text-paper placeholder:text-muted/60 outline-none focus:border-amber"
          />
          {error && <p className="mt-1.5 font-sans text-xs text-amber">{error}</p>}
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="rounded-full bg-amber px-5 py-2 font-sans text-sm font-semibold uppercase tracking-wider text-ink transition-colors hover:bg-amber-deep disabled:opacity-60"
            >
              {saving ? "Menghantar…" : "Hantar"}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full border border-line px-5 py-2 font-sans text-sm font-medium text-paper transition-colors hover:border-amber"
            >
              Batal
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-4 font-sans text-sm font-semibold text-amber transition-colors hover:text-amber-deep"
        >
          {submitted ? "Edit hantaran →" : "Hantar kerja →"}
        </button>
      )}
    </div>
  );
}
