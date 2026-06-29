"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, X, Star } from "lucide-react";
import { useSupabase } from "@/lib/supabase/client";
import { compressImage } from "@/lib/image-compress";

const inputCls =
  "w-full rounded-lg border border-line bg-ink px-4 py-3 font-sans text-sm text-paper placeholder:text-muted/60 outline-none focus:border-amber";

const MAX_MB = 20;
const MAX_IMAGES = 5;

type ImageEntry = { file: File; preview: string };

export default function NewsForm() {
  const router = useRouter();
  const supabase = useSupabase();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [images, setImages] = useState<ImageEntry[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (picked.length === 0) return;

    const remaining = MAX_IMAGES - images.length;
    if (remaining <= 0) {
      setError(`Maksimum ${MAX_IMAGES} gambar sahaja.`);
      return;
    }

    const toAdd: ImageEntry[] = [];
    for (const f of picked.slice(0, remaining)) {
      if (!f.type.startsWith("image/")) {
        setError("Sila pilih fail gambar sahaja.");
        return;
      }
      if (f.size > MAX_MB * 1024 * 1024) {
        setError(`"${f.name}" terlalu besar (maksimum ${MAX_MB}MB).`);
        return;
      }
      toAdd.push({ file: f, preview: URL.createObjectURL(f) });
    }
    setError(null);
    setImages((prev) => [...prev, ...toAdd]);
  };

  const remove = (idx: number) => {
    setImages((prev) => {
      URL.revokeObjectURL(prev[idx].preview);
      return prev.filter((_, i) => i !== idx);
    });
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
      // Muat naik semua gambar serentak ke Supabase Storage.
      const imageUrls: string[] = await Promise.all(
        images.map(async ({ file }) => {
          const compressed = await compressImage(file);
          const ext = compressed.name.split(".").pop() || "jpg";
          const path = `${crypto.randomUUID()}.${ext}`;
          const { error: upErr } = await supabase.storage
            .from("news-images")
            .upload(path, compressed, { upsert: false, contentType: compressed.type });
          if (upErr) throw new Error("Gagal muat naik gambar.");
          return supabase.storage.from("news-images").getPublicUrl(path).data.publicUrl;
        })
      );

      const res = await fetch("/api/portal/coach/news", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body, imageUrls }),
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
    images.forEach((img) => URL.revokeObjectURL(img.preview));
    setImages([]);
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

      {/* Grid pratonton gambar */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {images.map((img, i) => (
            <div key={img.preview} className="group relative">
              {/* eslint-disable-next-line @next/next/no-img-element -- pratonton tempatan */}
              <img
                src={img.preview}
                alt={`Gambar ${i + 1}`}
                className="aspect-video w-full rounded-lg border border-line object-cover"
              />
              {/* Lencana gambar utama */}
              {i === 0 && (
                <span className="absolute left-1.5 top-1.5 inline-flex items-center gap-1 rounded-full bg-amber px-2 py-0.5 font-sans text-[0.6rem] font-bold uppercase tracking-wide text-ink">
                  <Star className="h-2.5 w-2.5" /> Utama
                </span>
              )}
              {/* Nombor gambar (bukan utama) */}
              {i > 0 && (
                <span className="absolute left-1.5 top-1.5 rounded-full bg-ink/70 px-2 py-0.5 font-sans text-[0.6rem] font-semibold text-paper">
                  {i + 1}
                </span>
              )}
              <button
                type="button"
                onClick={() => remove(i)}
                aria-label={`Buang gambar ${i + 1}`}
                className="absolute right-1.5 top-1.5 rounded-full bg-ink/80 p-1 text-paper opacity-0 transition-opacity group-hover:opacity-100"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Butang tambah gambar — tersembunyi bila dah 5 */}
      {images.length < MAX_IMAGES && (
        <label className="flex cursor-pointer items-center gap-2 self-start rounded-lg border border-dashed border-line px-4 py-2.5 font-sans text-sm text-muted transition-colors hover:border-amber hover:text-amber">
          <ImagePlus className="h-4 w-4" />
          {images.length === 0
            ? "Tambah gambar (pilihan)"
            : `Tambah gambar lagi (${images.length}/${MAX_IMAGES})`}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={onPick}
            className="hidden"
          />
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
