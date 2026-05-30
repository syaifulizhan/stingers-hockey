"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Clock, Paperclip, X, Trash2, RotateCcw } from "lucide-react";
import { useSupabase } from "@/lib/supabase/client";
import { compressImage } from "@/lib/image-compress";

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
} | null;

const MAX_MB = 50;

function isVideo(url: string) {
  return /\.(mp4|mov|webm|m4v|ogg)(\?|$)/i.test(url);
}

export default function TaskCard({
  task,
  submission,
}: {
  task: Task;
  submission: Submission;
}) {
  const router = useRouter();
  const supabase = useSupabase();
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState(submission?.content ?? "");
  const [mediaUrl, setMediaUrl] = useState(submission?.media_url ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [deleting, setDeleting] = useState(false);
  const submitted = !!submission;
  const status = submission?.status;

  const del = async () => {
    if (!window.confirm("Padam hantaran ini? Anda boleh hantar semula selepas ini.")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/portal/submission?taskId=${task.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
    } catch {
      setDeleting(false);
      window.alert("Gagal padam. Cuba lagi.");
      return;
    }
    setDeleting(false);
    router.refresh();
  };

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/") && !f.type.startsWith("video/")) {
      setError("Sila pilih gambar atau video.");
      return;
    }
    if (f.size > MAX_MB * 1024 * 1024) {
      setError(`Fail terlalu besar (maksimum ${MAX_MB}MB). Cuba klip lebih pendek.`);
      return;
    }
    setError(null);
    setFile(f);
    setLocalPreview(URL.createObjectURL(f));
  };

  const clearMedia = () => {
    setFile(null);
    if (localPreview) URL.revokeObjectURL(localPreview);
    setLocalPreview(null);
    setMediaUrl(""); // buang bukti sedia ada juga
  };

  const save = async () => {
    setError(null);
    if (content.trim() === "") {
      setError("Sila tulis sesuatu.");
      return;
    }
    setSaving(true);
    try {
      // Muat naik bukti baharu jika ada.
      let finalMediaUrl = mediaUrl;
      if (file) {
        const toUpload = await compressImage(file); // imej dikecilkan; video kekal
        const ext = toUpload.name.split(".").pop() || "dat";
        const path = `${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("task-proof")
          .upload(path, toUpload, { upsert: false, contentType: toUpload.type });
        if (upErr) throw new Error("Gagal muat naik bukti.");
        finalMediaUrl = supabase.storage.from("task-proof").getPublicUrl(path)
          .data.publicUrl;
      }

      const res = await fetch("/api/portal/submission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId: task.id, content, mediaUrl: finalMediaUrl }),
      });
      if (!res.ok) throw new Error("Gagal menghantar.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal. Cuba lagi.");
      setSaving(false);
      return;
    }
    setSaving(false);
    setOpen(false);
    setFile(null);
    router.refresh();
  };

  const shownMedia = localPreview || mediaUrl;

  return (
    <div className="rounded-xl border border-line bg-bg-soft/50 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-sans text-base font-semibold text-paper">{task.title}</h3>
          {task.description && (
            <p className="mt-1 font-sans text-sm text-muted">{task.description}</p>
          )}
          {task.due_date && (
            <p className="mt-2 inline-flex items-center gap-1.5 font-sans text-xs text-muted">
              <Clock className="h-3.5 w-3.5" />
              Tarikh akhir: {task.due_date}
            </p>
          )}
        </div>
        {!submitted ? (
          <span className="shrink-0 rounded-full border border-line px-3 py-1 font-sans text-xs text-muted">
            Belum
          </span>
        ) : status === "reviewed" ? (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber px-3 py-1 font-sans text-xs font-semibold text-ink">
            <CheckCircle2 className="h-3.5 w-3.5" /> Disemak Coach
          </span>
        ) : status === "revise" ? (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-paper/15 px-3 py-1 font-sans text-xs font-semibold text-paper">
            <RotateCcw className="h-3.5 w-3.5" /> Perlu Ulang
          </span>
        ) : (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber/15 px-3 py-1 font-sans text-xs font-semibold text-amber">
            <CheckCircle2 className="h-3.5 w-3.5" /> Dihantar
          </span>
        )}
      </div>

      {/* Bukti sedia ada (bila tidak sedang edit) */}
      {!open && submission?.media_url && (
        <div className="mt-3 overflow-hidden rounded-lg border border-line">
          {isVideo(submission.media_url) ? (
            <video src={submission.media_url} controls className="max-h-64 w-full" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element -- bukti dari Supabase Storage
            <img src={submission.media_url} alt="Bukti" className="max-h-64 w-full object-contain" />
          )}
        </div>
      )}

      {open ? (
        <div className="mt-4">
          <textarea
            rows={3}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Tulis apa yang anda buat (cth: 30 minit dribbling, 50 push-up)…"
            className="w-full rounded-lg border border-line bg-ink px-4 py-3 font-sans text-sm text-paper placeholder:text-muted/60 outline-none focus:border-amber"
          />

          {/* Bukti gambar/video */}
          {shownMedia ? (
            <div className="relative mt-3 overflow-hidden rounded-lg border border-line">
              {(localPreview ? file?.type.startsWith("video/") : isVideo(shownMedia)) ? (
                <video src={shownMedia} controls className="max-h-64 w-full" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element -- pratonton/bukti
                <img src={shownMedia} alt="Bukti" className="max-h-64 w-full object-contain" />
              )}
              <button
                type="button"
                onClick={clearMedia}
                aria-label="Buang bukti"
                className="absolute right-2 top-2 rounded-full bg-ink/80 p-1.5 text-paper hover:bg-ink"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <label className="mt-3 flex cursor-pointer items-center gap-2 self-start rounded-lg border border-dashed border-line px-4 py-2.5 font-sans text-sm text-muted transition-colors hover:border-amber hover:text-amber">
              <Paperclip className="h-4 w-4" />
              Lampirkan bukti (gambar / video)
              <input
                type="file"
                accept="image/*,video/*"
                onChange={onPick}
                className="hidden"
              />
            </label>
          )}

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
        <div className="mt-4 flex items-center gap-4">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="font-sans text-sm font-semibold text-amber transition-colors hover:text-amber-deep"
          >
            {submitted ? "Edit hantaran →" : "Hantar kerja →"}
          </button>
          {submitted && (
            <button
              type="button"
              onClick={del}
              disabled={deleting}
              className="inline-flex items-center gap-1 font-sans text-sm text-muted transition-colors hover:text-amber disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {deleting ? "Memadam…" : "Padam"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
