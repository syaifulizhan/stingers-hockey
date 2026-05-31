"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";

const inputCls =
  "w-full rounded-lg border border-line bg-ink px-3 py-2 font-sans text-sm text-paper outline-none focus:border-amber";

type News = {
  id: string;
  title: string;
  body: string | null;
  published_at: string;
};

export default function NewsAdminItem({ news }: { news: News }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(news.title);
  const [body, setBody] = useState(news.body ?? "");
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (title.trim() === "") return;
    setBusy(true);
    try {
      const res = await fetch("/api/portal/coach/news", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: news.id, title, body }),
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
    if (!window.confirm(`Padam berita "${news.title}"?`)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/portal/coach/news?id=${news.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
    } catch {
      setBusy(false);
      window.alert("Gagal padam.");
      return;
    }
    router.refresh();
  };

  const posted = new Date(news.published_at).toLocaleString("ms-MY", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  if (editing) {
    return (
      <div className="flex flex-col gap-2 rounded-lg border border-line bg-bg-soft/50 p-3">
        <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Tajuk" />
        <textarea
          className={`${inputCls} resize-y`}
          rows={2}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Isi berita"
        />
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
        • {news.title} <span className="text-muted">({posted})</span>
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
