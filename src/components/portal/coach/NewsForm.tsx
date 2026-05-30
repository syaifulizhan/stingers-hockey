"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const inputCls =
  "w-full rounded-lg border border-line bg-ink px-4 py-3 font-sans text-sm text-paper placeholder:text-muted/60 outline-none focus:border-amber";

export default function NewsForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (title.trim() === "") {
      setError("Tajuk diperlukan.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/portal/coach/news", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => null);
        throw new Error(j?.error || "Gagal post berita.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal.");
      setSaving(false);
      return;
    }
    setTitle("");
    setBody("");
    setSaving(false);
    router.refresh();
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-3 rounded-xl border border-line bg-bg-soft/50 p-5">
      <input
        className={inputCls}
        placeholder="Tajuk berita"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <textarea
        rows={2}
        className={`${inputCls} resize-y`}
        placeholder="Isi berita (pilihan)…"
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />
      {error && <p className="font-sans text-xs text-amber">{error}</p>}
      <button
        type="submit"
        disabled={saving}
        className="self-start rounded-full bg-amber px-6 py-2.5 font-sans text-sm font-semibold uppercase tracking-wider text-ink transition-colors hover:bg-amber-deep disabled:opacity-60"
      >
        {saving ? "Menghantar…" : "Post Berita"}
      </button>
    </form>
  );
}
