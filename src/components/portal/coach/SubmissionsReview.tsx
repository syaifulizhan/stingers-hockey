"use client";

import { useState } from "react";

type Submission = {
  id: string;
  content: string | null;
  status: string;
  submitted_at: string;
  media_url: string | null;
  task_title: string;
  member_name: string;
};

function isVideo(url: string) {
  return /\.(mp4|mov|webm|m4v|ogg)(\?|$)/i.test(url);
}

const STATUS_LABEL: Record<string, string> = {
  submitted: "Dihantar",
  reviewed: "Disemak",
  revise: "Perlu Ulang",
};

export default function SubmissionsReview({
  submissions,
}: {
  submissions: Submission[];
}) {
  const [statusMap, setStatusMap] = useState<Record<string, string>>(
    Object.fromEntries(submissions.map((s) => [s.id, s.status]))
  );

  const setStatus = async (id: string, status: "reviewed" | "revise") => {
    const prev = statusMap[id];
    const next = prev === status ? "submitted" : status; // toggle
    setStatusMap((m) => ({ ...m, [id]: next }));
    try {
      const res = await fetch("/api/portal/coach/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionId: id, status: next }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setStatusMap((m) => ({ ...m, [id]: prev }));
      window.alert("Gagal kemas kini.");
    }
  };

  if (submissions.length === 0) {
    return (
      <p className="font-sans text-sm text-muted">
        Belum ada hantaran daripada ahli.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {submissions.map((s) => {
        const status = statusMap[s.id];
        return (
          <div key={s.id} className="rounded-xl border border-line bg-bg-soft/50 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-sans text-sm font-semibold text-paper">
                  {s.member_name}
                </p>
                <p className="font-sans text-xs text-amber">{s.task_title}</p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 font-sans text-xs font-semibold ${
                  status === "reviewed"
                    ? "bg-amber text-ink"
                    : status === "revise"
                      ? "bg-paper/15 text-paper"
                      : "border border-line text-muted"
                }`}
              >
                {STATUS_LABEL[status] ?? status}
              </span>
            </div>

            {s.content && (
              <p className="mt-3 whitespace-pre-wrap font-sans text-sm text-paper/90">
                {s.content}
              </p>
            )}

            {/* Bukti gambar/video */}
            {s.media_url && (
              <div className="mt-3 overflow-hidden rounded-lg border border-line">
                {isVideo(s.media_url) ? (
                  <video src={s.media_url} controls className="max-h-72 w-full" />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element -- bukti dari Supabase Storage
                  <img
                    src={s.media_url}
                    alt="Bukti"
                    className="max-h-72 w-full object-contain"
                  />
                )}
              </div>
            )}

            <p className="mt-2 font-sans text-xs text-muted">
              {new Date(s.submitted_at).toLocaleDateString("ms-MY")}
            </p>

            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => setStatus(s.id, "reviewed")}
                className="rounded-full border border-line px-4 py-1.5 font-sans text-xs font-semibold text-paper transition-colors hover:border-amber hover:text-amber"
              >
                Tanda Disemak
              </button>
              <button
                type="button"
                onClick={() => setStatus(s.id, "revise")}
                className="rounded-full border border-line px-4 py-1.5 font-sans text-xs font-semibold text-paper transition-colors hover:border-amber hover:text-amber"
              >
                Minta Ulang
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
