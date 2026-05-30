"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, X } from "lucide-react";
import { useSupabase } from "@/lib/supabase/client";
import { compressImage } from "@/lib/image-compress";

const inputCls =
  "w-full rounded-lg border border-line bg-ink px-4 py-3 font-sans text-sm text-paper placeholder:text-muted/60 outline-none focus:border-amber";

const MAX_MB = 5;

export default function NewsForm() {
  const router = useRouter();
  const supabase = useSupabase();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      setError("Sila pilih fail gambar.");
      return;
    }
    if (f.size > MAX_MB * 1024 * 1024) {
      setError(`Gambar terlalu besar (maksimum ${MAX_MB}MB).`);
      return;
    }
    setError(null);
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const clearImage = () => {
    setFile(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (title.trim() === "") {
      setError("Tajuk diperlukan.");
      return;
    }
    setSaving(true);

    try {
      // 1. Muat naik gambar ke Supabase Storage (jika ada).
      let imageUrl = "";
      if (file) {
        const compressed = await compressImage(file);
        const ext = compressed.name.split(".").pop() || "jpg";
        const path = `${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("news-images")
          .upload(path, compressed, { upsert: false, contentType: compressed.type });
        if (upErr) throw new Error("Gagal muat naik gambar.");
        imageUrl = supabase.storage.from("news-images").getPublicUrl(path)
          .data.publicUrl;
      }

      // 2. Simpan berita.
      const res = await fetch("/api/portal/coach/news", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body, imageUrl }),
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
    clearImage();
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

      {/* Gambar */}
      {preview ? (
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element -- pratonton tempatan */}
          <img
            src={preview}
            alt="Pratonton"
            className="aspect-video w-full rounded-lg border border-line object-cover"
          />
          <button
            type="button"
            onClick={clearImage}
            aria-label="Buang gambar"
            className="absolute right-2 top-2 rounded-full bg-ink/80 p-1.5 text-paper hover:bg-ink"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <label className="flex cursor-pointer items-center gap-2 self-start rounded-lg border border-dashed border-line px-4 py-2.5 font-sans text-sm text-muted transition-colors hover:border-amber hover:text-amber">
          <ImagePlus className="h-4 w-4" />
          Tambah gambar (pilihan)
          <input type="file" accept="image/*" onChange={onPick} className="hidden" />
        </label>
      )}

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
