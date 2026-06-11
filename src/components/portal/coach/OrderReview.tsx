"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Check, X, Trash2, Table2, Download, Pencil } from "lucide-react";
import { useSupabase } from "@/lib/supabase/client";
import { KID_SIZES, ADULT_SIZES, ringgit } from "@/lib/shop";

const SIZE_ORDER = [...KID_SIZES, ...ADULT_SIZES];

const csv = (s: unknown) => `"${String(s ?? "").replace(/"/g, '""')}"`;
const downloadCsvFile = (lines: string[], name: string) => {
  const blob = new Blob(["﻿" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
};

type Item = {
  category: string;
  label: string;
  reka_bentuk?: string | null;
  penutup?: string | null;
  lengan?: string | null;
  material?: string | null;
  edition_id?: string;
  size: string;
  qty: number;
  print_name?: string | null;
  print_number?: string | null;
  unit: number;
};
type Order = {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  category: string | null;
  items: Item[];
  subtotal: number | string;
  discount: number | string;
  total: number | string;
  delivery?: string | null;
  postage?: number | string;
  address?: string | null;
  proof_url: string | null;
  proof_drive_url: string | null;
  status: string;
  created_at: string;
};

const STATUS: Record<string, { label: string; cls: string }> = {
  menunggu_semakan: { label: "Menunggu Semakan", cls: "bg-amber/20 text-amber" },
  disahkan: { label: "Disahkan", cls: "bg-green-500/20 text-green-400" },
  ditolak: { label: "Ditolak", cls: "bg-red-500/20 text-red-400" },
};

export default function OrderReview({ orders }: { orders: Order[] }) {
  const router = useRouter();
  const supabase = useSupabase();
  const [filter, setFilter] = useState("menunggu_semakan");
  // busyId = id tempahan yang sedang diproses → hanya kad itu malap (tiada
  // kelipan pada kad lain).
  const [busyId, setBusyId] = useState<string | null>(null);
  // fadingId = id tempahan yang Sah/Tolak baru ditekan → butang malap & lenyap.
  const [fadingId, setFadingId] = useState<string | null>(null);
  const [showPivot, setShowPivot] = useState(false);

  // Lapisan optimistik. router.refresh() menyegarkan data pelayan, tetapi paparan
  // terbitan (Pivot, Senarai Susun, senarai kad) MESTI berubah serta-merta selepas
  // tindakan — jangan tunggu data pelayan tiba. Padaman & tukar status direkod di
  // sini dan ditindih atas prop `orders`, supaya SEMUA paparan kekal konsisten
  // (elak pivot/susun masih kira tempahan yang baru dipadam). Tindihan ini hanya
  // hidup dalam sesi & dikosongkan bila halaman dimuat semula; setiap laluan tukar
  // status mengemas kini tindihan, jadi ia tak pernah jadi basi.
  const [removedIds, setRemovedIds] = useState<Set<string>>(() => new Set());
  const [statusOverride, setStatusOverride] = useState<Record<string, string>>({});

  const effectiveOrders = useMemo(
    () =>
      orders
        .filter((o) => !removedIds.has(o.id))
        .map((o) => (statusOverride[o.id] ? { ...o, status: statusOverride[o.id] } : o)),
    [orders, removedIds, statusOverride]
  );

  const shown = effectiveOrders.filter((o) => (filter === "semua" ? true : o.status === filter));

  const setStatus = async (id: string, status: string) => {
    setBusyId(id);
    const { error } = await supabase.from("shop_orders").update({ status }).eq("id", id);
    setBusyId(null);
    if (error) {
      window.alert("Gagal kemas kini status.");
      return;
    }
    setStatusOverride((m) => ({ ...m, [id]: status }));
    router.refresh();
  };

  // "Sah" → pindah bukti ke Google Drive & clear storan (data tempahan kekal).
  const confirmOrder = async (id: string) => {
    setBusyId(id);
    try {
      const res = await fetch("/api/portal/order/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: id }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "Gagal sah tempahan.");
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Gagal sah tempahan.");
      setBusyId(null);
      return;
    }
    setBusyId(null);
    setStatusOverride((m) => ({ ...m, [id]: "disahkan" }));
    router.refresh();
  };

  const del = async (o: Order) => {
    if (!window.confirm(`Padam tempahan ${o.full_name}?`)) return;
    setBusyId(o.id);
    if (o.proof_url) {
      const i = o.proof_url.indexOf("/shop/");
      if (i !== -1) await supabase.storage.from("shop").remove([o.proof_url.slice(i + 6)]);
    }
    const { error } = await supabase.from("shop_orders").delete().eq("id", o.id);
    if (error) {
      setBusyId(null);
      window.alert("Gagal padam tempahan.");
      return;
    }
    await supabase.from("notifications").delete().eq("ref_type", "order").eq("ref_id", o.id);
    setBusyId(null);
    setRemovedIds((s) => new Set(s).add(o.id));
    router.refresh();
  };

  // Senarai susun untuk edaran kepada pelanggan (tempahan disahkan).
  const downloadCustomerCsv = () => {
    const confirmed = effectiveOrders.filter((o) => o.status === "disahkan");
    const lines = [["Nama", "Telefon", "Item", "Saiz", "Kuantiti", "Cetak Nama", "Cetak Nombor"].map(csv).join(",")];
    for (const o of confirmed) {
      for (const it of o.items ?? []) {
        lines.push([o.full_name, o.phone, it.label, it.size, it.qty, it.print_name ?? "", it.print_number ?? ""].map(csv).join(","));
      }
    }
    downloadCsvFile(lines, `susun-pelanggan-${new Date().toISOString().slice(0, 10)}.csv`);
  };

  return (
    <div className="mb-8">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          {[
            ["menunggu_semakan", "Menunggu"],
            ["disahkan", "Disahkan"],
            ["ditolak", "Ditolak"],
            ["semua", "Semua"],
          ].map(([k, lbl]) => (
            <button
              key={k}
              type="button"
              onClick={() => setFilter(k)}
              className={`rounded-full px-3 py-1 font-sans text-xs font-semibold transition-colors ${
                filter === k ? "bg-amber text-ink" : "border border-line text-paper hover:border-amber"
              }`}
            >
              {lbl}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={downloadCustomerCsv}
            className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1 font-sans text-xs font-semibold text-paper hover:border-amber hover:text-amber"
          >
            <Download className="h-3.5 w-3.5" /> Senarai Susun
          </button>
          <button
            type="button"
            onClick={() => setShowPivot((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1 font-sans text-xs font-semibold text-paper hover:border-amber hover:text-amber"
          >
            <Table2 className="h-3.5 w-3.5" /> Jana Pivot
          </button>
        </div>
      </div>

      {showPivot && <Pivot orders={effectiveOrders} />}

      {shown.length === 0 ? (
        <p className="font-sans text-sm text-muted">Tiada tempahan dalam kategori ini.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {shown.map((o) => {
            const st = STATUS[o.status] ?? { label: o.status, cls: "border border-line text-muted" };
            return (
              <div key={o.id} className="rounded-xl border border-line bg-bg-soft/50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-sans text-sm font-semibold text-paper">{o.full_name}</p>
                    <p className="font-sans text-xs text-muted">
                      {o.phone}
                      {o.email ? ` · ${o.email}` : ""}
                    </p>
                    <p className="font-sans text-[0.7rem] text-muted">
                      {new Date(o.created_at).toLocaleString("ms-MY", {
                        day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 font-sans text-xs font-semibold ${st.cls}`}>
                    {st.label}
                  </span>
                </div>

                <ul className="mt-3 flex flex-col gap-1 border-t border-line pt-3">
                  {o.items.map((it, idx) => (
                    <li key={idx} className="flex justify-between gap-2 font-sans text-xs text-paper/90">
                      <span className="min-w-0 truncate">
                        {it.label} · {it.size} × {it.qty}
                        {it.print_name ? ` · Nama: ${it.print_name}` : ""}
                        {it.print_number ? ` · No: ${it.print_number}` : ""}
                      </span>
                      <span className="shrink-0 text-muted">{ringgit((Number(it.unit) || 0) * it.qty)}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-2 flex items-center justify-between font-sans text-sm">
                  <span className="text-muted">
                    {Number(o.discount) > 0 ? `Diskaun −${ringgit(Number(o.discount))} · ` : ""}
                    {Number(o.postage) > 0 ? `Pos +${ringgit(Number(o.postage))} · ` : ""}Jumlah
                  </span>
                  <span className="font-bold text-amber">
                    {ringgit((Number(o.total) || 0) + (Number(o.postage) || 0))}
                  </span>
                </div>
                <p className="mt-1 font-sans text-xs text-muted">
                  {o.delivery === "pos" ? "📦 Pos" : "🤝 Ambil sendiri"}
                  {o.delivery === "pos" && o.address ? ` — ${o.address}` : ""}
                </p>

                {o.proof_url && (
                  <a href={o.proof_url} target="_blank" rel="noopener noreferrer" className="mt-3 block">
                    {/* eslint-disable-next-line @next/next/no-img-element -- bukti dari Storage */}
                    <img src={o.proof_url} alt="Bukti pindahan" className="max-h-44 rounded-lg border border-line object-contain" />
                  </a>
                )}

                {!o.proof_url && o.proof_drive_url && (
                  <a
                    href={o.proof_drive_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 font-sans text-xs font-semibold text-paper hover:border-amber hover:text-amber"
                  >
                    <Download className="h-3.5 w-3.5" /> Bukti di Drive
                  </a>
                )}

                <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line pt-3">
                  {o.status === "menunggu_semakan" ? (
                    <div className={`flex flex-wrap gap-2 transition-opacity duration-300 ${fadingId === o.id ? "pointer-events-none opacity-0" : "opacity-100"}`}>
                      <button type="button" disabled={busyId === o.id} onClick={() => { setFadingId(o.id); confirmOrder(o.id); }} className="inline-flex items-center gap-1 rounded-full border border-green-500/50 px-3 py-1.5 font-sans text-xs font-semibold text-green-400 hover:bg-green-500/10 disabled:opacity-50">
                        <Check className="h-3.5 w-3.5" /> Sah
                      </button>
                      <button type="button" disabled={busyId === o.id} onClick={() => { setFadingId(o.id); setStatus(o.id, "ditolak"); }} className="inline-flex items-center gap-1 rounded-full border border-red-500/50 px-3 py-1.5 font-sans text-xs font-semibold text-red-400 hover:bg-red-500/10 disabled:opacity-50">
                        <X className="h-3.5 w-3.5" /> Tolak
                      </button>
                    </div>
                  ) : (
                    <button type="button" disabled={busyId === o.id} onClick={() => { setFadingId(null); setStatus(o.id, "menunggu_semakan"); }} className="inline-flex items-center gap-1 rounded-full border border-line px-3 py-1.5 font-sans text-xs font-semibold text-paper hover:border-amber hover:text-amber disabled:opacity-50">
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </button>
                  )}
                  <button type="button" disabled={busyId === o.id} onClick={() => del(o)} className="ml-auto inline-flex items-center gap-1 rounded-full border border-line px-3 py-1.5 font-sans text-xs font-semibold text-muted hover:border-amber hover:text-amber disabled:opacity-50">
                    <Trash2 className="h-3.5 w-3.5" /> Padam
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ───────── Pivot untuk supplier (tempahan DISAHKAN sahaja) ───────── */
function Pivot({ orders }: { orders: Order[] }) {
  const confirmed = orders.filter((o) => o.status === "disahkan");

  // Jersi: kumpul ikut Reka Bentuk · Lengan · Material × Saiz.
  const rows = new Map<string, { reka: string; penutup: string; lengan: string; material: string; sizes: Record<string, number>; total: number }>();
  const sizeSet = new Set<string>();
  let namePrint = 0;
  let numberPrint = 0;
  for (const o of confirmed) {
    for (const it of o.items ?? []) {
      if (it.category !== "jersi") continue;
      const k = `${it.reka_bentuk}|${it.penutup}|${it.lengan}|${it.material}`;
      const row = rows.get(k) ?? { reka: it.reka_bentuk ?? "", penutup: it.penutup ?? "", lengan: it.lengan ?? "", material: it.material ?? "", sizes: {}, total: 0 };
      row.sizes[it.size] = (row.sizes[it.size] ?? 0) + it.qty;
      row.total += it.qty;
      rows.set(k, row);
      sizeSet.add(it.size);
      if (it.print_name) namePrint += it.qty;
      if (it.print_number) numberPrint += it.qty;
    }
  }
  const sizes = SIZE_ORDER.filter((s) => sizeSet.has(s));
  const rowList = [...rows.values()];
  const grand = rowList.reduce((s, r) => s + r.total, 0);
  const grandRM = confirmed.reduce((s, o) => s + (Number(o.total) || 0), 0);

  const downloadCsv = () => {
    const head = ["Reka Bentuk", "Penutup", "Lengan", "Material", ...sizes, "Jumlah"];
    const lines = [head.join(",")];
    for (const r of rowList) {
      lines.push([r.reka, r.penutup, r.lengan, r.material, ...sizes.map((s) => r.sizes[s] ?? 0), r.total].join(","));
    }
    lines.push(["GRAND TOTAL", "", "", "", ...sizes.map(() => ""), grand].join(","));
    lines.push("");
    lines.push(`Cetak nama: ${namePrint}`);
    lines.push(`Cetak nombor: ${numberPrint}`);
    lines.push(`Jumlah (RM): ${grandRM.toFixed(2)}`);
    const blob = new Blob(["﻿" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `pivot-jersi-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  // Hustle Gear (baharu) — ikut saiz sahaja (standardize).
  const hustleSizes = new Map<string, number>();
  for (const o of confirmed) {
    for (const it of o.items ?? []) {
      if (it.category !== "hustle_gear") continue;
      hustleSizes.set(it.size, (hustleSizes.get(it.size) ?? 0) + it.qty);
    }
  }
  const hSizes = SIZE_ORDER.filter((s) => hustleSizes.has(s));
  const hTotal = [...hustleSizes.values()].reduce((a, b) => a + b, 0);
  const downloadHustleCsv = () => {
    const lines = [["Saiz", "Kuantiti"].join(",")];
    for (const s of hSizes) lines.push([s, hustleSizes.get(s) ?? 0].join(","));
    lines.push(["JUMLAH", hTotal].join(","));
    downloadCsvFile(lines, `pivot-hustle-${new Date().toISOString().slice(0, 10)}.csv`);
  };

  // Koleksi lama (jersi_lama + hustle_lama) — kumpul IKUT EDISI (artwork beda),
  // kemudian reka bentuk/penutup/lengan/material × saiz.
  const edName = (label: string) => label.split(" · ")[0] || label;
  const lamaRows = new Map<string, { edisi: string; reka: string; penutup: string; lengan: string; material: string; sizes: Record<string, number>; total: number }>();
  const lamaSizeSet = new Set<string>();
  let lamaNamePrint = 0;
  let lamaNumberPrint = 0;
  for (const o of confirmed) {
    for (const it of o.items ?? []) {
      if (it.category !== "jersi_lama" && it.category !== "hustle_lama") continue;
      const edisi = edName(it.label);
      const k = `${edisi}|${it.reka_bentuk}|${it.penutup}|${it.lengan}|${it.material}`;
      const row = lamaRows.get(k) ?? { edisi, reka: it.reka_bentuk ?? "", penutup: it.penutup ?? "", lengan: it.lengan ?? "", material: it.material ?? "", sizes: {}, total: 0 };
      row.sizes[it.size] = (row.sizes[it.size] ?? 0) + it.qty;
      row.total += it.qty;
      lamaRows.set(k, row);
      lamaSizeSet.add(it.size);
      if (it.print_name) lamaNamePrint += it.qty;
      if (it.print_number) lamaNumberPrint += it.qty;
    }
  }
  const lamaSizes = SIZE_ORDER.filter((s) => lamaSizeSet.has(s));
  const lamaList = [...lamaRows.values()].sort((a, b) => a.edisi.localeCompare(b.edisi));
  const lamaGrand = lamaList.reduce((s, r) => s + r.total, 0);
  const downloadLamaCsv = () => {
    const head = ["Edisi", "Reka Bentuk", "Penutup", "Lengan", "Material", ...lamaSizes, "Jumlah"];
    const lines = [head.map(csv).join(",")];
    for (const r of lamaList) {
      lines.push([r.edisi, r.reka, r.penutup, r.lengan, r.material, ...lamaSizes.map((s) => r.sizes[s] ?? 0), r.total].map(csv).join(","));
    }
    lines.push(["GRAND TOTAL", "", "", "", "", ...lamaSizes.map(() => ""), lamaGrand].map(csv).join(","));
    lines.push("");
    lines.push(`Cetak nama: ${lamaNamePrint}`);
    lines.push(`Cetak nombor: ${lamaNumberPrint}`);
    downloadCsvFile(lines, `pivot-koleksi-lama-${new Date().toISOString().slice(0, 10)}.csv`);
  };

  return (
    <div className="mb-4 overflow-hidden rounded-xl border border-amber/40 bg-ink/40 p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="font-sans text-xs font-semibold uppercase tracking-wider text-amber">
          Pivot Jersi — tempahan disahkan
        </p>
        {rowList.length > 0 && (
          <button type="button" onClick={downloadCsv} className="inline-flex items-center gap-1 rounded-full border border-line px-3 py-1 font-sans text-xs font-semibold text-paper hover:border-amber hover:text-amber">
            <Download className="h-3.5 w-3.5" /> CSV
          </button>
        )}
      </div>
      {rowList.length === 0 ? (
        <p className="font-sans text-sm text-muted">Tiada tempahan jersi disahkan lagi.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse font-sans text-xs">
            <thead>
              <tr className="text-muted">
                <th className="px-2 py-1 text-left">Reka Bentuk</th>
                <th className="px-2 py-1 text-left">Penutup</th>
                <th className="px-2 py-1 text-left">Lengan</th>
                <th className="px-2 py-1 text-left">Material</th>
                {sizes.map((s) => <th key={s} className="px-2 py-1 text-center">{s}</th>)}
                <th className="px-2 py-1 text-center font-bold text-amber">Jumlah</th>
              </tr>
            </thead>
            <tbody>
              {rowList.map((r, i) => (
                <tr key={i} className="border-t border-line text-paper">
                  <td className="px-2 py-1">{r.reka}</td>
                  <td className="px-2 py-1">{r.penutup || "–"}</td>
                  <td className="px-2 py-1">{r.lengan}</td>
                  <td className="px-2 py-1">{r.material}</td>
                  {sizes.map((s) => <td key={s} className="px-2 py-1 text-center tabular-nums">{r.sizes[s] ?? "–"}</td>)}
                  <td className="px-2 py-1 text-center font-bold tabular-nums text-amber">{r.total}</td>
                </tr>
              ))}
              <tr className="border-t-2 border-amber/40 font-bold text-amber">
                <td className="px-2 py-1" colSpan={4}>GRAND TOTAL</td>
                {sizes.map((s) => (
                  <td key={s} className="px-2 py-1 text-center tabular-nums">
                    {rowList.reduce((sum, r) => sum + (r.sizes[s] ?? 0), 0)}
                  </td>
                ))}
                <td className="px-2 py-1 text-center tabular-nums">{grand}</td>
              </tr>
            </tbody>
          </table>
          <p className="mt-2 font-sans text-xs text-muted">
            Cetak nama: <span className="text-paper">{namePrint}</span> · Cetak nombor:{" "}
            <span className="text-paper">{numberPrint}</span> · Jumlah (RM):{" "}
            <span className="text-paper">{ringgit(grandRM)}</span>
          </p>
        </div>
      )}

      {/* Pivot Hustle Gear (ikut saiz) */}
      <div className="mt-5 border-t border-amber/30 pt-4">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="font-sans text-xs font-semibold uppercase tracking-wider text-amber">
            Pivot Hustle Gear
          </p>
          {hSizes.length > 0 && (
            <button type="button" onClick={downloadHustleCsv} className="inline-flex items-center gap-1 rounded-full border border-line px-3 py-1 font-sans text-xs font-semibold text-paper hover:border-amber hover:text-amber">
              <Download className="h-3.5 w-3.5" /> CSV
            </button>
          )}
        </div>
        {hSizes.length === 0 ? (
          <p className="font-sans text-sm text-muted">Tiada tempahan Hustle Gear disahkan lagi.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse font-sans text-xs">
              <thead>
                <tr className="text-muted">
                  {hSizes.map((s) => <th key={s} className="px-2 py-1 text-center">{s}</th>)}
                  <th className="px-2 py-1 text-center font-bold text-amber">Jumlah</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-line text-paper">
                  {hSizes.map((s) => <td key={s} className="px-2 py-1 text-center tabular-nums">{hustleSizes.get(s) ?? "–"}</td>)}
                  <td className="px-2 py-1 text-center font-bold tabular-nums text-amber">{hTotal}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pivot Koleksi Lama (ikut edisi — artwork beda dari jersi terkini) */}
      <div className="mt-5 border-t border-amber/30 pt-4">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="font-sans text-xs font-semibold uppercase tracking-wider text-amber">
            Pivot Koleksi Lama (ikut edisi)
          </p>
          {lamaList.length > 0 && (
            <button type="button" onClick={downloadLamaCsv} className="inline-flex items-center gap-1 rounded-full border border-line px-3 py-1 font-sans text-xs font-semibold text-paper hover:border-amber hover:text-amber">
              <Download className="h-3.5 w-3.5" /> CSV
            </button>
          )}
        </div>
        {lamaList.length === 0 ? (
          <p className="font-sans text-sm text-muted">Tiada tempahan koleksi lama disahkan lagi.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse font-sans text-xs">
              <thead>
                <tr className="text-muted">
                  <th className="px-2 py-1 text-left">Edisi</th>
                  <th className="px-2 py-1 text-left">Reka Bentuk</th>
                  <th className="px-2 py-1 text-left">Penutup</th>
                  <th className="px-2 py-1 text-left">Lengan</th>
                  <th className="px-2 py-1 text-left">Material</th>
                  {lamaSizes.map((s) => <th key={s} className="px-2 py-1 text-center">{s}</th>)}
                  <th className="px-2 py-1 text-center font-bold text-amber">Jumlah</th>
                </tr>
              </thead>
              <tbody>
                {lamaList.map((r, i) => (
                  <tr key={i} className="border-t border-line text-paper">
                    <td className="px-2 py-1">{r.edisi}</td>
                    <td className="px-2 py-1">{r.reka || "–"}</td>
                    <td className="px-2 py-1">{r.penutup || "–"}</td>
                    <td className="px-2 py-1">{r.lengan || "–"}</td>
                    <td className="px-2 py-1">{r.material || "–"}</td>
                    {lamaSizes.map((s) => <td key={s} className="px-2 py-1 text-center tabular-nums">{r.sizes[s] ?? "–"}</td>)}
                    <td className="px-2 py-1 text-center font-bold tabular-nums text-amber">{r.total}</td>
                  </tr>
                ))}
                <tr className="border-t-2 border-amber/40 font-bold text-amber">
                  <td className="px-2 py-1" colSpan={5}>GRAND TOTAL</td>
                  {lamaSizes.map((s) => (
                    <td key={s} className="px-2 py-1 text-center tabular-nums">
                      {lamaList.reduce((sum, r) => sum + (r.sizes[s] ?? 0), 0)}
                    </td>
                  ))}
                  <td className="px-2 py-1 text-center tabular-nums">{lamaGrand}</td>
                </tr>
              </tbody>
            </table>
            <p className="mt-2 font-sans text-xs text-muted">
              Cetak nama: <span className="text-paper">{lamaNamePrint}</span> · Cetak nombor:{" "}
              <span className="text-paper">{lamaNumberPrint}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
