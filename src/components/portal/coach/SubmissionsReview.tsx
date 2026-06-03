"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Download, UploadCloud } from "lucide-react";

// Pautan muat turun (Supabase Storage: ?download paksa simpan fail).
const downloadUrl = (u: string) => u + (u.includes("?") ? "&" : "?") + "download";

type Submission = {
  id: string;
  content: string | null;
  status: string;
  submitted_at: string;
  media_url: string | null;
  late?: boolean;
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
  const router = useRouter();
  const [statusMap, setStatusMap] = useState<Record<string, string>>(
    Object.fromEntries(submissions.map((s) => [s.id, s.status]))
  );
  const [backfilling, setBackfilling] = useState(false);

  // Pindah SEMUA bukti hantaran yang sudah "Disemak" ke Google Drive sekali gus,
  // kemudian clear dari Supabase (jimat storan). Data hantaran kekal.
  const backfillToDrive = async () => {
    if (!window.confirm("Pindah semua bukti hantaran yang sudah DISEMAK ke Google Drive dan clear dari storan? Data hantaran kekal.")) return;
    setBackfilling(true);
    try {
      const res = await fetch("/api/portal/coach/backfill-drive", { method: "POST" });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "Gagal.");
      window.alert(
        `Selesai. ${json.moved} bukti dipindah ke Drive.` +
          (json.failed ? ` ${json.failed} gagal:\n${(json.errors ?? []).join("\n")}` : "")
      );
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Gagal pindah ke Drive.");
      setBackfilling(false);
      return;
    }
    setBackfilling(false);
    router.refresh();
  };

  const del = async (id: string, who: string) => {
    if (!window.confirm(`Padam hantaran daripada ${who}?`)) return;
    try {
      const res = await fetch(`/api/portal/coach/review?id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
    } catch {
      window.alert("Gagal padam.");
      return;
    }
    router.refresh();
  };

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

  const backfillBtn = (
    <button
      type="button"
      onClick={backfillToDrive}
      disabled={backfilling}
      className="inline-flex items-center gap-1.5 rounded-full border border-amber/50 px-3 py-1 font-sans text-xs font-semibold text-amber transition-colors hover:bg-amber/10 disabled:opacity-50"
    >
      <UploadCloud className="h-3.5 w-3.5" />
      {backfilling ? "Memindah…" : "Pindah bukti disemak → Drive"}
    </button>
  );

  if (submissions.length === 0) {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex justify-end">{backfillBtn}</div>
        <p className="font-sans text-sm text-muted">
          Belum ada hantaran daripada ahli.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">{backfillBtn}</div>
      {submissions.map((s) => {
        const status = statusMap[s.id];
        return (
          <div key={s.id} className="rounded-xl border border-line bg-bg-soft/50 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="flex items-center gap-2 font-sans text-sm font-semibold text-paper">
                  {s.member_name}
                  {s.late && (
                    <span className="rounded-full bg-orange-500/20 px-2 py-0.5 font-sans text-[0.6rem] font-semibold uppercase text-orange-400">
                      Lewat
                    </span>
                  )}
                </p>
                <p className="font-sans text-xs text-amber">{s.task_title}</p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 font-sans text-xs font-semibold ${
                  status === "reviewed"
                    ? "bg-green-500/20 text-green-400"
                    : status === "revise"
                      ? "bg-red-500/20 text-red-400"
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
              <div className="mt-3">
                <div className="overflow-hidden rounded-lg border border-line">
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
                <a
                  href={downloadUrl(s.media_url)}
                  className="mt-2 inline-flex items-center gap-1 font-sans text-xs font-semibold text-amber transition-colors hover:text-amber-deep"
                >
                  <Download className="h-3.5 w-3.5" /> Muat turun
                </a>
              </div>
            )}

            <p className="mt-2 font-sans text-xs text-muted">
              {new Date(s.submitted_at).toLocaleDateString("ms-MY")}
            </p>

            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => setStatus(s.id, "reviewed")}
                className={`rounded-full border px-4 py-1.5 font-sans text-xs font-semibold transition-colors ${
                  status === "reviewed"
                    ? "border-green-500/50 bg-green-500/20 text-green-400"
                    : "border-line text-paper hover:border-green-500/50 hover:text-green-400"
                }`}
              >
                Tanda Disemak
              </button>
              <button
                type="button"
                onClick={() => setStatus(s.id, "revise")}
                className={`rounded-full border px-4 py-1.5 font-sans text-xs font-semibold transition-colors ${
                  status === "revise"
                    ? "border-red-500/50 bg-red-500/20 text-red-400"
                    : "border-line text-paper hover:border-red-500/50 hover:text-red-400"
                }`}
              >
                Minta Ulang
              </button>
              <button
                type="button"
                onClick={() => del(s.id, s.member_name)}
                className="ml-auto inline-flex items-center gap-1 rounded-full border border-line px-3 py-1.5 font-sans text-xs font-semibold text-muted transition-colors hover:border-amber hover:text-amber"
              >
                <Trash2 className="h-3.5 w-3.5" /> Padam
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
