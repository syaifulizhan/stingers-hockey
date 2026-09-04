"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Trash2, Upload, X, Eye, EyeOff, ExternalLink } from "lucide-react";
import { useSupabase } from "@/lib/supabase/client";
import { compressImage } from "@/lib/image-compress";

export type LegasiRow = {
  id: string;
  slug: string;
  record_no: string;
  cohort: number;
  full_name: string;
  name_first: string | null;
  name_last: string | null;
  result: string | null;
  category: string | null;
  event: string | null;
  school: string | null;
  story: string | null;
  quote_text: string | null;
  quote_by: string | null;
  journey: { year: string; what: string; peak?: boolean }[] | null;
  photos: string[] | null;
  hero_image: string | null;
  card_front: string | null;
  card_back: string | null;
  status: "draft" | "published";
  published_at: string | null;
  archived_at?: string | null;
  legacy_versions?: { version_no: number; captured_at: string }[] | null;
};

// Lebar SENGAJA diasingkan daripada gaya asas. Versi awal menyimpan `w-full`
// di dalam `input`, jadi `${input} w-24` menghasilkan dua utiliti lebar yang
// bercanggah — `w-full` menang, medan tahun mengembang, dan medan keterangan
// dipicit sehingga hilang pada skrin sempit.
const inputBase =
  "rounded-lg border border-line bg-ink px-3 py-2 font-sans text-sm text-paper placeholder:text-muted/60 focus:border-amber focus:outline-none";
const input = `w-full ${inputBase}`;
const label = "font-sans text-xs font-semibold uppercase tracking-wider text-muted";

export default function LegasiAdmin({ records }: { records: LegasiRow[] }) {
  const router = useRouter();
  const [bukaId, setBukaId] = useState<string | null>(null);
  const [pesan, setPesan] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border border-line bg-bg-soft p-5">
        <h2 className="font-sans text-base font-semibold text-paper">Hall of Honour</h2>
        <p className="mt-2 font-sans text-sm leading-relaxed text-muted">
          Rekod kekal untuk pemain yang mewakili di peringkat lebih tinggi. Semua rekod bermula
          sebagai <strong className="text-paper">draf</strong> dan tidak kelihatan awam sehingga
          ditekan Terbitkan — sekatan itu dikuatkuasakan di pangkalan data, bukan sekadar di skrin
          ini.
        </p>
        <p className="mt-2 font-sans text-sm leading-relaxed text-muted">
          Rekod yang sudah tersiar <strong className="text-paper">boleh disunting</strong> bila-bila
          masa — pemain naik ke peringkat lebih tinggi, cerita diperbaiki, gambar ditambah. Setiap
          versi yang pernah tersiar disimpan kekal, jadi menyunting tidak pernah memadam sejarah.
        </p>
        <p className="mt-2 font-sans text-xs leading-relaxed text-muted">
          Yang dikunci hanyalah slug: ia alamat yang dicetak pada kad fizikal. Setiap penerbitan
          juga menghantar salinan ke Internet Archive.
        </p>
      </div>

      {pesan && (
        <p className="rounded-lg border border-amber/40 bg-amber/10 px-4 py-3 font-sans text-sm text-amber">
          {pesan}
        </p>
      )}

      {records.map((r) => (
        <RekodEditor
          key={r.id}
          row={r}
          terbuka={bukaId === r.id}
          onToggle={() => setBukaId(bukaId === r.id ? null : r.id)}
          onSelesai={(m) => {
            setPesan(m);
            router.refresh();
          }}
        />
      ))}

      {records.length === 0 && (
        <p className="rounded-xl border border-dashed border-line px-5 py-10 text-center font-sans text-sm text-muted">
          Belum ada rekod. Jalankan migrasi <code className="text-amber">20260904_dewan_legasi.sql</code>{" "}
          untuk memasukkan dua penerima pertama sebagai draf.
        </p>
      )}
    </div>
  );
}

function RekodEditor({
  row,
  terbuka,
  onToggle,
  onSelesai,
}: {
  row: LegasiRow;
  terbuka: boolean;
  onToggle: () => void;
  onSelesai: (pesan: string) => void;
}) {
  const supabase = useSupabase();
  const [f, setF] = useState({
    slug: row.slug,
    recordNo: row.record_no,
    cohort: row.cohort,
    fullName: row.full_name,
    nameFirst: row.name_first ?? "",
    nameLast: row.name_last ?? "",
    result: row.result ?? "",
    category: row.category ?? "",
    event: row.event ?? "",
    school: row.school ?? "",
    story: row.story ?? "",
    quoteText: row.quote_text ?? "",
    quoteBy: row.quote_by ?? "",
    heroImage: row.hero_image ?? "",
    cardFront: row.card_front ?? "",
    cardBack: row.card_back ?? "",
  });
  const [journey, setJourney] = useState(row.journey ?? []);
  const [photos, setPhotos] = useState<string[]>(row.photos ?? []);
  const [sibuk, setSibuk] = useState(false);
  const [ralat, setRalat] = useState<string | null>(null);

  const tersiar = row.status === "published";

  const muatNaik = async (file: File): Promise<string> => {
    const kecil = await compressImage(file);
    const ext = kecil.name.split(".").pop() || "jpg";
    const path = `${row.slug}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage
      .from("legasi")
      .upload(path, kecil, { upsert: false, contentType: kecil.type });
    if (error) throw new Error("Gagal muat naik gambar.");
    return supabase.storage.from("legasi").getPublicUrl(path).data.publicUrl;
  };

  const hantar = async (status?: "draft" | "published") => {
    setSibuk(true);
    setRalat(null);
    try {
      const res = await fetch("/api/portal/coach/legasi", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: row.id,
          ...f,
          cohort: Number(f.cohort),
          // Baris yang belum diisi langsung tidak perlu dihantar.
          journey: journey.filter((l) => l.year.trim() !== "" || l.what.trim() !== ""),
          photos,
          ...(status ? { status } : {}),
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        // 422 memulangkan `errors` per-medan, bukan `error`. Versi awal hanya
        // membaca `error`, jadi kegagalan pengesahan kelihatan seperti
        // "Gagal menyimpan." tanpa memberitahu medan mana yang salah.
        const perMedan = json.errors
          ? Object.entries(json.errors as Record<string, string[]>)
              .map(([medan, pesan]) => `${medan}: ${(pesan ?? []).join(", ")}`)
              .join(" · ")
          : null;
        setRalat(json.error ?? perMedan ?? "Gagal menyimpan.");
        return;
      }
      const arkibNota = json.arkib?.ok ? " Salinan arkib dihantar." : "";
      onSelesai(
        status === "published"
          ? `${f.fullName} kini tersiar di hoki.my/legasi/${f.slug}.${arkibNota}`
          : status === "draft"
            ? `${f.fullName} ditarik balik ke draf.`
            : tersiar
              ? `Versi baharu ${f.fullName} tersimpan — versi lama dikekalkan.${arkibNota}`
              : "Draf disimpan.",
      );
    } catch {
      setRalat("Gagal menghubungi pelayan.");
    } finally {
      setSibuk(false);
    }
  };

  return (
    <div className="rounded-xl border border-line bg-bg-soft">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <div className="min-w-0">
          <p className="truncate font-sans text-sm font-semibold text-paper">{row.full_name}</p>
          <p className="mt-0.5 font-sans text-xs text-muted">
            {row.record_no} · {row.cohort} · /legasi/{row.slug}
            {row.legacy_versions && row.legacy_versions.length > 1
              ? ` · v${Math.max(...row.legacy_versions.map((v) => v.version_no))}`
              : ""}
            {row.archived_at ? " · diarkib" : ""}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-3 py-1 font-sans text-[11px] font-semibold uppercase tracking-wider ${
            tersiar ? "bg-amber text-ink" : "border border-line text-muted"
          }`}
        >
          {tersiar ? "Tersiar" : "Draf"}
        </span>
      </button>

      {terbuka && (
        <div className="border-t border-line px-5 py-5">
          {ralat && (
            <p className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 font-sans text-sm text-red-300">
              {ralat}
            </p>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Medan label="Nama penuh (rasmi)">
              <input
                className={input}
                value={f.fullName}
                onChange={(e) => setF({ ...f, fullName: e.target.value })}
              />
            </Medan>
            <Medan label="Slug (alamat kekal)" nota={tersiar ? "Dikunci — sudah tersiar" : undefined}>
              <input
                className={input}
                value={f.slug}
                disabled={tersiar}
                onChange={(e) => setF({ ...f, slug: e.target.value })}
              />
            </Medan>
            <Medan label="Nama baris 1 (besar)">
              <input
                className={input}
                value={f.nameFirst}
                onChange={(e) => setF({ ...f, nameFirst: e.target.value })}
              />
            </Medan>
            <Medan label="Nama baris 2 (besar)">
              <input
                className={input}
                value={f.nameLast}
                onChange={(e) => setF({ ...f, nameLast: e.target.value })}
              />
            </Medan>
            <Medan label="Keputusan">
              <input
                className={input}
                placeholder="JOHAN"
                value={f.result}
                onChange={(e) => setF({ ...f, result: e.target.value })}
              />
            </Medan>
            <Medan label="Kategori">
              <input
                className={input}
                placeholder="Lelaki 12 Tahun · Selangor"
                value={f.category}
                onChange={(e) => setF({ ...f, category: e.target.value })}
              />
            </Medan>
            <Medan label="Kejohanan">
              <input
                className={input}
                value={f.event}
                onChange={(e) => setF({ ...f, event: e.target.value })}
              />
            </Medan>
            <Medan label="Sekolah">
              <input
                className={input}
                value={f.school}
                onChange={(e) => setF({ ...f, school: e.target.value })}
              />
            </Medan>
            <Medan label="Nombor rekod">
              <input
                className={input}
                value={f.recordNo}
                onChange={(e) => setF({ ...f, recordNo: e.target.value })}
              />
            </Medan>
            <Medan label="Tahun kohort">
              <input
                type="number"
                className={input}
                value={f.cohort}
                onChange={(e) => setF({ ...f, cohort: Number(e.target.value) })}
              />
            </Medan>
          </div>

          <div className="mt-4">
            <Medan label="Cerita — pisahkan perenggan dengan baris kosong">
              <textarea
                rows={6}
                className={input}
                value={f.story}
                onChange={(e) => setF({ ...f, story: e.target.value })}
              />
            </Medan>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_240px]">
            <Medan label="Petikan jurulatih">
              <textarea
                rows={3}
                className={input}
                value={f.quoteText}
                onChange={(e) => setF({ ...f, quoteText: e.target.value })}
              />
            </Medan>
            <Medan label="Dipetik daripada">
              <input
                className={input}
                value={f.quoteBy}
                onChange={(e) => setF({ ...f, quoteBy: e.target.value })}
              />
            </Medan>
          </div>

          {/* Perjalanan */}
          <div className="mt-6">
            <p className={label}>Perjalanan</p>
            <div className="mt-2 flex flex-col gap-2">
              {journey.map((s, i) => (
                <div
                  key={i}
                  className="flex flex-col gap-2 rounded-lg border border-line p-3 sm:flex-row sm:items-center sm:border-0 sm:p-0"
                >
                  <input
                    className={`${inputBase} w-full sm:w-24 sm:shrink-0`}
                    placeholder="2026"
                    inputMode="numeric"
                    aria-label="Tahun"
                    value={s.year}
                    onChange={(e) => {
                      const next = [...journey];
                      next[i] = { ...s, year: e.target.value };
                      setJourney(next);
                    }}
                  />
                  <input
                    className={input}
                    placeholder="Johan · Kejohanan Hoki MSSM"
                    aria-label="Keterangan langkah"
                    value={s.what}
                    onChange={(e) => {
                      const next = [...journey];
                      next[i] = { ...s, what: e.target.value };
                      setJourney(next);
                    }}
                  />
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      aria-pressed={!!s.peak}
                      title="Tandakan sebagai kemuncak — dipaparkan dengan aksen amber"
                      onClick={() => {
                        const next = [...journey];
                        next[i] = { ...s, peak: !s.peak };
                        setJourney(next);
                      }}
                      className={`flex-1 rounded-lg border px-3 py-2 font-sans text-xs sm:flex-none ${
                        s.peak ? "border-amber text-amber" : "border-line text-muted"
                      }`}
                    >
                      ◆<span className="ml-1.5 sm:hidden">Kemuncak</span>
                    </button>
                    <button
                      type="button"
                      aria-label="Buang langkah ini"
                      onClick={() => setJourney(journey.filter((_, j) => j !== i))}
                      className="flex-1 rounded-lg border border-line px-3 py-2 text-muted hover:text-red-400 sm:flex-none"
                    >
                      <Trash2 className="mx-auto h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setJourney([...journey, { year: "", what: "", peak: false }])}
                className="inline-flex w-fit items-center gap-1.5 rounded-lg border border-line px-3 py-2 font-sans text-xs text-muted hover:border-amber hover:text-amber"
              >
                <Plus className="h-3.5 w-3.5" /> Tambah langkah
              </button>
            </div>
          </div>

          {/* Gambar */}
          <div className="mt-6 grid gap-5 sm:grid-cols-3">
            <SlotGambar
              label="Potret utama"
              url={f.heroImage}
              onPilih={async (file) => setF({ ...f, heroImage: await muatNaik(file) })}
              onBuang={() => setF({ ...f, heroImage: "" })}
            />
            <SlotGambar
              label="Kad — depan"
              url={f.cardFront}
              onPilih={async (file) => setF({ ...f, cardFront: await muatNaik(file) })}
              onBuang={() => setF({ ...f, cardFront: "" })}
            />
            <SlotGambar
              label="Kad — belakang"
              url={f.cardBack}
              onPilih={async (file) => setF({ ...f, cardBack: await muatNaik(file) })}
              onBuang={() => setF({ ...f, cardBack: "" })}
            />
          </div>

          <div className="mt-6">
            <p className={label}>Album — jalur bergerak di bawah profil (maksimum 7)</p>
            <div className="mt-2 flex flex-wrap gap-3">
              {photos.map((src, i) => (
                <div key={i} className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src}
                    alt={`Album ${i + 1}`}
                    className="h-28 w-24 rounded-lg border border-line object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setPhotos(photos.filter((_, j) => j !== i))}
                    className="absolute -right-2 -top-2 rounded-full border border-line bg-ink p-1 text-muted hover:text-red-400"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {photos.length < 7 && (
                <label className="flex h-28 w-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-line text-muted hover:border-amber hover:text-amber">
                  <Upload className="h-4 w-4" />
                  <span className="font-sans text-[10px]">Tambah</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={async (e) => {
                      const files = [...(e.target.files ?? [])].slice(0, 7 - photos.length);
                      const urls: string[] = [];
                      for (const file of files) urls.push(await muatNaik(file));
                      setPhotos([...photos, ...urls]);
                    }}
                  />
                </label>
              )}
            </div>
            <p className="mt-2 font-sans text-xs text-muted">{photos.length}/7 gambar</p>
          </div>

          {/* Tindakan */}
          <div className="mt-7 flex flex-wrap items-center gap-3 border-t border-line pt-5">
            <button
              onClick={() => hantar()}
              disabled={sibuk}
              className="rounded-lg border border-line px-4 py-2 font-sans text-sm text-paper hover:border-amber hover:text-amber disabled:opacity-50"
            >
              {sibuk ? "Menyimpan…" : tersiar ? "Simpan versi baharu" : "Simpan draf"}
            </button>

            {tersiar ? (
              <button
                onClick={() => hantar("draft")}
                disabled={sibuk}
                className="inline-flex items-center gap-1.5 rounded-lg border border-line px-4 py-2 font-sans text-sm text-muted hover:text-paper disabled:opacity-50"
              >
                <EyeOff className="h-4 w-4" /> Tarik balik ke draf
              </button>
            ) : (
              <button
                onClick={() => hantar("published")}
                disabled={sibuk}
                className="inline-flex items-center gap-1.5 rounded-lg bg-amber px-4 py-2 font-sans text-sm font-semibold text-ink hover:bg-amber-deep disabled:opacity-50"
              >
                <Eye className="h-4 w-4" /> Terbitkan
              </button>
            )}

            <Link
              href={`/portal/coach/legasi/${row.slug}`}
              target="_blank"
              className="ml-auto inline-flex items-center gap-1.5 font-sans text-xs font-semibold text-amber hover:underline"
            >
              <Eye className="h-3.5 w-3.5" /> Pratonton halaman
            </Link>
            {tersiar && (
              <Link
                href={`/legasi/${row.slug}`}
                target="_blank"
                className="inline-flex items-center gap-1.5 font-sans text-xs text-muted hover:text-amber"
              >
                Halaman sebenar <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>

          {tersiar ? (
            <p className="mt-3 font-sans text-xs leading-relaxed text-muted">
              Rekod ini tersiar. Menyimpan akan mencipta versi baharu — versi sebelumnya kekal
              tersimpan selamanya dan boleh dilihat pada halaman awam.
              {row.archived_at
                ? ` Salinan arkib terakhir: ${new Date(row.archived_at).toLocaleDateString("ms-MY")}.`
                : ""}
            </p>
          ) : (
            <p className="mt-3 font-sans text-xs text-muted">
              Draf ini tidak kelihatan oleh sesiapa di luar portal. Sesiapa yang mengimbas QR
              sekarang akan melihat halaman &ldquo;belum tersedia&rdquo;, bukan ralat.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function Medan({
  label: teks,
  nota,
  children,
}: {
  label: string;
  nota?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className={label}>
        {teks}
        {nota && <span className="ml-2 normal-case tracking-normal text-amber/70">{nota}</span>}
      </p>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

function SlotGambar({
  label: teks,
  url,
  onPilih,
  onBuang,
}: {
  label: string;
  url: string;
  onPilih: (file: File) => Promise<void>;
  onBuang: () => void;
}) {
  const [sibuk, setSibuk] = useState(false);
  return (
    <div>
      <p className={label}>{teks}</p>
      <div className="mt-1.5">
        {url ? (
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={teks} className="aspect-[3/4] w-full rounded-lg border border-line object-cover" />
            <button
              type="button"
              onClick={onBuang}
              className="absolute -right-2 -top-2 rounded-full border border-line bg-ink p-1 text-muted hover:text-red-400"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <label className="flex aspect-[3/4] w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-line text-muted hover:border-amber hover:text-amber">
            <Upload className="h-5 w-5" />
            <span className="font-sans text-[11px]">{sibuk ? "Memuat naik…" : "Pilih gambar"}</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setSibuk(true);
                try {
                  await onPilih(file);
                } finally {
                  setSibuk(false);
                }
              }}
            />
          </label>
        )}
      </div>
    </div>
  );
}
