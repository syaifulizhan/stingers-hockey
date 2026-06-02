"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Plus, ImagePlus } from "lucide-react";
import { useSupabase } from "@/lib/supabase/client";
import { compressImage } from "@/lib/image-compress";

const inputCls =
  "w-full rounded-lg border border-line bg-ink px-3 py-2 font-sans text-sm text-paper placeholder:text-muted/60 outline-none focus:border-amber";
const labelCls = "mb-1 block font-sans text-xs text-muted";
const cardCls = "rounded-xl border border-line bg-bg-soft/50 p-5";
const btnCls =
  "rounded-full bg-amber px-5 py-2 font-sans text-xs font-semibold uppercase tracking-wider text-ink transition-colors hover:bg-amber-deep disabled:opacity-60";
const sectionTitle = "display text-xl text-paper";

const num = (v: unknown) => Number(v) || 0;
const ringgit = (n: number) => `RM ${n.toFixed(2)}`;

// Ciri berstruktur jersi (untuk pivot supplier yang kemas).
const REKA_BENTUK = ["Bulat", "Berkolar", "Muslimah"];
const LENGAN = ["Pendek", "Panjang"];
const MATERIAL = ["Biasa", "Lycra"];

// Carta saiz: kunci + label paparan.
const JERSI_CHARTS = [
  { key: "lengan_pendek", label: "Lengan Pendek" },
  { key: "lengan_panjang", label: "Lengan Panjang" },
  { key: "muslimah", label: "Muslimah" },
];
const HUSTLE_CHARTS = [{ key: "standard", label: "Carta Saiz" }];
const variantLabel = (v: Variant) =>
  [v.reka_bentuk, v.lengan, v.material].filter(Boolean).join(" · ") || v.label;

type Product = {
  id: string;
  name: string;
  image_url: string | null;
  base_price: number | string;
  big_size_surcharge: number | string;
  kid_discount: number | string;
  name_print_enabled: boolean;
  name_print_fee: number | string;
  size_charts?: Record<string, string> | null;
};
type Variant = {
  id: string;
  product_id: string;
  label: string;
  price: number | string;
  sort_order: number;
  reka_bentuk?: string | null;
  lengan?: string | null;
  material?: string | null;
};
type Edition = {
  id: string;
  name: string;
  year: string | null;
  image_url: string | null;
  price: number | string;
  for_sale: boolean;
  sort_order: number;
  kind?: string | null;
};
type Settings = {
  pakej_discount_percent: number;
  pakej_min_items: number;
  duitnow_qr_url?: string | null;
  info_akaun?: string | null;
};

export default function ShopAdmin({
  products,
  variants,
  editions,
  settings,
}: {
  products: Product[];
  variants: Variant[];
  editions: Edition[];
  settings: Settings;
}) {
  const router = useRouter();
  const supabase = useSupabase();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const jersi = products.find((p) => p.id === "jersi");
  const hustle = products.find((p) => p.id === "hustle_gear");
  const jersiVariants = variants.filter((v) => v.product_id === "jersi");

  // Upload gambar ke bucket 'shop' → pulang URL awam.
  const uploadImage = async (file: File): Promise<string> => {
    const compressed = await compressImage(file);
    const ext = compressed.name.split(".").pop() || "jpg";
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage
      .from("shop")
      .upload(path, compressed, { upsert: false, contentType: compressed.type });
    if (error) throw new Error("Gagal muat naik gambar.");
    return supabase.storage.from("shop").getPublicUrl(path).data.publicUrl;
  };

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setErr(null);
    try {
      await fn();
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Gagal menyimpan.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {err && (
        <p className="rounded-lg border border-amber/50 bg-amber/10 px-4 py-2 font-sans text-sm text-amber">
          {err}
        </p>
      )}

      {jersi && (
        <ProductSettings
          title="Jersi"
          product={jersi}
          showBasePrice={false}
          chartKeys={JERSI_CHARTS}
          uploadImage={uploadImage}
          run={run}
          busy={busy}
          supabase={supabase}
        >
          <VariantEditor
            productId="jersi"
            variants={jersiVariants}
            run={run}
            busy={busy}
            supabase={supabase}
          />
        </ProductSettings>
      )}

      {hustle && (
        <ProductSettings
          title="Hustle Gear"
          product={hustle}
          showBasePrice
          chartKeys={HUSTLE_CHARTS}
          uploadImage={uploadImage}
          run={run}
          busy={busy}
          supabase={supabase}
        />
      )}

      <EditionsEditor
        editions={editions}
        kind="jersi"
        title="Legasi Jersi (Jersi Lama)"
        subtitle="Set harga & tanda &ldquo;boleh beli&rdquo; untuk edisi cetak semula. Jersi semasa yang diarkib turun ke sini."
        uploadImage={uploadImage}
        run={run}
        busy={busy}
        supabase={supabase}
      />
      <EditionsEditor
        editions={editions}
        kind="hustle_gear"
        title="Legasi Hustle Gear"
        subtitle="Hustle Gear lama yang diarkib. Tanda &ldquo;boleh beli&rdquo; jika nak dijual."
        uploadImage={uploadImage}
        run={run}
        busy={busy}
        supabase={supabase}
      />

      <DuitNowSettings settings={settings} uploadImage={uploadImage} run={run} busy={busy} supabase={supabase} />

      <PakejSettings settings={settings} run={run} busy={busy} supabase={supabase} />
    </div>
  );
}

/* ───────────────────────── DuitNow (QR + akaun) ───────────────────────── */
function DuitNowSettings({
  settings,
  uploadImage,
  run,
  busy,
  supabase,
}: {
  settings: Settings;
  uploadImage: (f: File) => Promise<string>;
  run: Run;
  busy: boolean;
  supabase: SB;
}) {
  const [info, setInfo] = useState(settings.info_akaun ?? "");

  const saveInfo = () =>
    run(async () => {
      const { error } = await supabase.from("shop_settings").update({ info_akaun: info }).eq("id", 1);
      if (error) throw new Error(error.message);
    });

  const onQr = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    run(async () => {
      const url = await uploadImage(f);
      const { error } = await supabase.from("shop_settings").update({ duitnow_qr_url: url }).eq("id", 1);
      if (error) throw new Error(error.message);
    });
  };

  return (
    <div className={cardCls}>
      <h3 className={`${sectionTitle} mb-1`}>DuitNow & Pengesahan</h3>
      <p className="mb-4 font-sans text-xs text-muted">
        Kod QR & maklumat akaun ini dipapar kepada pelanggan untuk pindahan.
      </p>
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="sm:w-40">
          {settings.duitnow_qr_url ? (
            // eslint-disable-next-line @next/next/no-img-element -- QR dari Storage
            <img src={settings.duitnow_qr_url} alt="QR DuitNow" className="aspect-square w-full rounded-lg border border-line object-contain bg-paper p-2" />
          ) : (
            <div className="flex aspect-square w-full items-center justify-center rounded-lg border border-dashed border-line text-muted">
              <ImagePlus className="h-6 w-6" />
            </div>
          )}
          <label className="mt-2 block cursor-pointer text-center font-sans text-xs font-semibold text-amber hover:text-amber-deep">
            Muat naik QR
            <input type="file" accept="image/*" onChange={onQr} className="hidden" />
          </label>
        </div>
        <div className="flex-1">
          <label className={labelCls}>Maklumat akaun (dipapar kepada pelanggan)</label>
          <textarea
            rows={4}
            className={`${inputCls} resize-y`}
            placeholder={"Cth:\nNama: Tabung Hoki Stingers\nBank: Maybank 1234 5678 90\nRujukan: Nama penuh anda"}
            value={info}
            onChange={(e) => setInfo(e.target.value)}
          />
          <button type="button" onClick={saveInfo} disabled={busy} className={`${btnCls} mt-3`}>
            Simpan Maklumat
          </button>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── Jersi / Hustle Gear ───────────────────────── */
type SB = ReturnType<typeof useSupabase>;
type Run = (fn: () => Promise<void>) => Promise<void>;

function ProductSettings({
  title,
  product,
  showBasePrice,
  chartKeys = [],
  uploadImage,
  run,
  busy,
  supabase,
  children,
}: {
  title: string;
  product: Product;
  showBasePrice: boolean;
  chartKeys?: { key: string; label: string }[];
  uploadImage: (f: File) => Promise<string>;
  run: Run;
  busy: boolean;
  supabase: SB;
  children?: React.ReactNode;
}) {
  const [basePrice, setBasePrice] = useState(String(num(product.base_price)));
  const [bigSurcharge, setBigSurcharge] = useState(String(num(product.big_size_surcharge)));
  const [kidDiscount, setKidDiscount] = useState(String(num(product.kid_discount)));
  const [namePrint, setNamePrint] = useState(product.name_print_enabled);
  const [nameFee, setNameFee] = useState(String(num(product.name_print_fee)));
  const [arkibOpen, setArkibOpen] = useState(false);
  const [arkibName, setArkibName] = useState("");
  const [arkibYear, setArkibYear] = useState("");

  const save = () =>
    run(async () => {
      const { error } = await supabase
        .from("shop_products")
        .update({
          base_price: num(basePrice),
          big_size_surcharge: num(bigSurcharge),
          kid_discount: num(kidDiscount),
          name_print_enabled: namePrint,
          name_print_fee: num(nameFee),
          updated_at: new Date().toISOString(),
        })
        .eq("id", product.id);
      if (error) throw new Error(error.message);
    });

  const onImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    run(async () => {
      const url = await uploadImage(f);
      const { error } = await supabase.from("shop_products").update({ image_url: url }).eq("id", product.id);
      if (error) throw new Error(error.message);
    });
  };

  const onChart = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    run(async () => {
      const url = await uploadImage(f);
      const charts = { ...(product.size_charts ?? {}), [key]: url };
      const { error } = await supabase.from("shop_products").update({ size_charts: charts }).eq("id", product.id);
      if (error) throw new Error(error.message);
    });
  };

  // Arkib gambar semasa → legasi, kosongkan slot (variasi/harga kekal).
  const arkib = () =>
    run(async () => {
      if (!product.image_url) return;
      if (arkibName.trim() === "") throw new Error("Sila masukkan nama untuk legasi.");
      const { error: insErr } = await supabase.from("jersey_editions").insert({
        id: `${product.id}-${Date.now()}`,
        kind: product.id,
        name: arkibName.trim(),
        year: arkibYear.trim() || null,
        image_url: product.image_url,
        sort_order: 0,
      });
      if (insErr) throw new Error(insErr.message);
      const { error: upErr } = await supabase.from("shop_products").update({ image_url: null }).eq("id", product.id);
      if (upErr) throw new Error(upErr.message);
      setArkibOpen(false);
      setArkibName("");
      setArkibYear("");
    });

  return (
    <div className={cardCls}>
      <h3 className={`${sectionTitle} mb-4`}>{title}</h3>
      <div className="flex flex-col gap-4 sm:flex-row">
        {/* Gambar */}
        <div className="sm:w-40">
          {product.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element -- gambar dari Storage
            <img src={product.image_url} alt="" className="aspect-square w-full rounded-lg border border-line object-cover" />
          ) : (
            <div className="flex aspect-square w-full items-center justify-center rounded-lg border border-dashed border-line text-muted">
              <ImagePlus className="h-6 w-6" />
            </div>
          )}
          <label className="mt-2 block cursor-pointer text-center font-sans text-xs font-semibold text-amber hover:text-amber-deep">
            Tukar gambar
            <input type="file" accept="image/*" onChange={onImage} className="hidden" />
          </label>
          {product.image_url && (
            <div className="mt-2">
              {!arkibOpen ? (
                <button type="button" onClick={() => setArkibOpen(true)} className="block w-full text-center font-sans text-[0.7rem] font-semibold text-muted hover:text-amber">
                  Arkib ke legasi →
                </button>
              ) : (
                <div className="flex flex-col gap-1.5 rounded-lg border border-line bg-ink/40 p-2">
                  <input className={`${inputCls} text-xs`} placeholder="Nama (cth Ventralis ed.)" value={arkibName} onChange={(e) => setArkibName(e.target.value)} />
                  <input className={`${inputCls} text-xs`} placeholder="Tahun (cth 2025)" value={arkibYear} onChange={(e) => setArkibYear(e.target.value)} />
                  <div className="flex gap-1.5">
                    <button type="button" onClick={arkib} disabled={busy} className="flex-1 rounded-full bg-amber px-2 py-1 font-sans text-[0.7rem] font-semibold text-ink hover:bg-amber-deep disabled:opacity-60">
                      Arkib
                    </button>
                    <button type="button" onClick={() => setArkibOpen(false)} className="rounded-full border border-line px-2 py-1 font-sans text-[0.7rem] text-paper">
                      Batal
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Tetapan harga */}
        <div className="grid flex-1 gap-3 sm:grid-cols-2">
          {showBasePrice && (
            <div>
              <label className={labelCls}>Harga asas (RM)</label>
              <input type="number" step="0.01" min="0" className={inputCls} value={basePrice} onChange={(e) => setBasePrice(e.target.value)} />
            </div>
          )}
          <div>
            <label className={labelCls}>Caj saiz besar (+RM)</label>
            <input type="number" step="0.01" min="0" className={inputCls} value={bigSurcharge} onChange={(e) => setBigSurcharge(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Potongan kanak (−RM)</label>
            <input type="number" step="0.01" min="0" className={inputCls} value={kidDiscount} onChange={(e) => setKidDiscount(e.target.value)} />
          </div>
          <label className="flex items-center gap-2 font-sans text-sm text-paper/90">
            <input type="checkbox" className="h-4 w-4 accent-amber" checked={namePrint} onChange={(e) => setNamePrint(e.target.checked)} />
            Tawar cetak nama
          </label>
          {namePrint && (
            <div>
              <label className={labelCls}>Fi cetak nama (+RM)</label>
              <input type="number" step="0.01" min="0" className={inputCls} value={nameFee} onChange={(e) => setNameFee(e.target.value)} />
            </div>
          )}
        </div>
      </div>

      {/* Carta saiz */}
      {chartKeys.length > 0 && (
        <div className="mt-5 border-t border-line pt-4">
          <p className={labelCls}>Carta Saiz (gambar)</p>
          <div className="flex flex-wrap gap-3">
            {chartKeys.map((ck) => {
              const url = product.size_charts?.[ck.key];
              return (
                <div key={ck.key} className="w-28">
                  {url ? (
                    // eslint-disable-next-line @next/next/no-img-element -- carta dari Storage
                    <img src={url} alt={ck.label} className="aspect-[3/4] w-full rounded-lg border border-line object-cover" />
                  ) : (
                    <div className="flex aspect-[3/4] w-full items-center justify-center rounded-lg border border-dashed border-line text-muted">
                      <ImagePlus className="h-5 w-5" />
                    </div>
                  )}
                  <label className="mt-1 block cursor-pointer text-center font-sans text-[0.7rem] font-semibold text-amber hover:text-amber-deep">
                    {ck.label}
                    <input type="file" accept="image/*" onChange={onChart(ck.key)} className="hidden" />
                  </label>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {children}

      <button type="button" onClick={save} disabled={busy} className={`${btnCls} mt-4`}>
        Simpan {title}
      </button>
    </div>
  );
}

/* ───────────────────────── Variasi jersi ───────────────────────── */
function VariantEditor({
  productId,
  variants,
  run,
  busy,
  supabase,
}: {
  productId: string;
  variants: Variant[];
  run: Run;
  busy: boolean;
  supabase: SB;
}) {
  const [rekaBentuk, setRekaBentuk] = useState("");
  const [lengan, setLengan] = useState("");
  const [material, setMaterial] = useState("");
  const [price, setPrice] = useState("");

  const add = () =>
    run(async () => {
      if (!rekaBentuk || !lengan || !material) throw new Error("Sila pilih Reka Bentuk, Lengan & Material.");
      const { error } = await supabase.from("shop_variants").insert({
        product_id: productId,
        reka_bentuk: rekaBentuk,
        lengan,
        material,
        label: `${rekaBentuk} · ${lengan} · ${material}`,
        price: num(price),
        sort_order: variants.length,
      });
      if (error) throw new Error(error.message);
      setRekaBentuk("");
      setLengan("");
      setMaterial("");
      setPrice("");
    });

  const del = (id: string) =>
    run(async () => {
      const { error } = await supabase.from("shop_variants").delete().eq("id", id);
      if (error) throw new Error(error.message);
    });

  return (
    <div className="mt-5 border-t border-line pt-4">
      <p className={labelCls}>Jenis jersi (variasi) — Reka Bentuk · Lengan · Material + harga</p>
      {variants.length > 0 && (
        <ul className="mb-3 flex flex-col gap-1.5">
          {variants.map((v) => (
            <li key={v.id} className="flex items-center gap-2 rounded-lg border border-line bg-ink/40 px-3 py-2">
              <span className="min-w-0 flex-1 truncate font-sans text-sm text-paper">{variantLabel(v)}</span>
              <span className="shrink-0 font-sans text-sm font-semibold text-amber">{ringgit(num(v.price))}</span>
              <button type="button" onClick={() => del(v.id)} disabled={busy} aria-label="Padam" className="shrink-0 text-muted hover:text-amber">
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="grid gap-2 sm:grid-cols-4">
        <select className={inputCls} value={rekaBentuk} onChange={(e) => setRekaBentuk(e.target.value)}>
          <option value="">Reka Bentuk…</option>
          {REKA_BENTUK.map((x) => <option key={x} value={x}>{x}</option>)}
        </select>
        <select className={inputCls} value={lengan} onChange={(e) => setLengan(e.target.value)}>
          <option value="">Lengan…</option>
          {LENGAN.map((x) => <option key={x} value={x}>{x}</option>)}
        </select>
        <select className={inputCls} value={material} onChange={(e) => setMaterial(e.target.value)}>
          <option value="">Material…</option>
          {MATERIAL.map((x) => <option key={x} value={x}>{x}</option>)}
        </select>
        <input type="number" step="0.01" min="0" className={inputCls} placeholder="Harga (RM)" value={price} onChange={(e) => setPrice(e.target.value)} />
      </div>
      <button type="button" onClick={add} disabled={busy} className="mt-2 inline-flex items-center justify-center gap-1 rounded-lg border border-line px-3 py-2 font-sans text-xs font-semibold text-paper hover:border-amber hover:text-amber disabled:opacity-50">
        <Plus className="h-4 w-4" /> Tambah variasi
      </button>
    </div>
  );
}

/* ───────────────────────── Jersi Lama (edisi) ───────────────────────── */
function EditionsEditor({
  editions,
  kind,
  title,
  subtitle,
  uploadImage,
  run,
  busy,
  supabase,
}: {
  editions: Edition[];
  kind: string;
  title: string;
  subtitle: string;
  uploadImage: (f: File) => Promise<string>;
  run: Run;
  busy: boolean;
  supabase: SB;
}) {
  const items = editions.filter((e) => (e.kind ?? "jersi") === kind);
  return (
    <div className={cardCls}>
      <h3 className={`${sectionTitle} mb-1`}>{title}</h3>
      <p className="mb-4 font-sans text-xs text-muted">{subtitle}</p>
      {items.length === 0 ? (
        <p className="font-sans text-sm text-muted">Belum ada edisi di sini.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((ed) => (
            <EditionRow key={ed.id} edition={ed} uploadImage={uploadImage} run={run} busy={busy} supabase={supabase} />
          ))}
        </div>
      )}
    </div>
  );
}

function EditionRow({
  edition,
  uploadImage,
  run,
  busy,
  supabase,
}: {
  edition: Edition;
  uploadImage: (f: File) => Promise<string>;
  run: Run;
  busy: boolean;
  supabase: SB;
}) {
  const [price, setPrice] = useState(String(num(edition.price)));
  const [forSale, setForSale] = useState(edition.for_sale);

  const save = () =>
    run(async () => {
      const { error } = await supabase
        .from("jersey_editions")
        .update({ price: num(price), for_sale: forSale })
        .eq("id", edition.id);
      if (error) throw new Error(error.message);
    });

  const onImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    run(async () => {
      const url = await uploadImage(f);
      const { error } = await supabase.from("jersey_editions").update({ image_url: url }).eq("id", edition.id);
      if (error) throw new Error(error.message);
    });
  };

  const del = () => {
    if (!window.confirm(`Padam "${edition.name}" dari legasi?`)) return;
    run(async () => {
      if (edition.image_url) {
        const i = edition.image_url.indexOf("/shop/");
        if (i !== -1) await supabase.storage.from("shop").remove([edition.image_url.slice(i + 6)]);
      }
      const { error } = await supabase.from("jersey_editions").delete().eq("id", edition.id);
      if (error) throw new Error(error.message);
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-line bg-ink/40 px-3 py-2">
      {edition.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element -- gambar edisi
        <img src={edition.image_url} alt="" className="h-10 w-10 shrink-0 rounded object-cover" />
      ) : (
        <div className="h-10 w-10 shrink-0 rounded bg-bg-soft" />
      )}
      <span className="min-w-0 flex-1 truncate font-sans text-sm text-paper">
        {edition.name} <span className="text-muted">{edition.year}</span>
      </span>
      <input type="number" step="0.01" min="0" className={`${inputCls} w-24`} value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Harga" />
      <label className="flex items-center gap-1.5 font-sans text-xs text-paper/90">
        <input type="checkbox" className="h-4 w-4 accent-amber" checked={forSale} onChange={(e) => setForSale(e.target.checked)} />
        Boleh beli
      </label>
      <label className="cursor-pointer font-sans text-xs font-semibold text-amber hover:text-amber-deep">
        Gambar
        <input type="file" accept="image/*" onChange={onImage} className="hidden" />
      </label>
      <button type="button" onClick={save} disabled={busy} className="rounded-full bg-amber px-3 py-1.5 font-sans text-xs font-semibold text-ink hover:bg-amber-deep disabled:opacity-60">
        Simpan
      </button>
      <button type="button" onClick={del} disabled={busy} aria-label="Padam" className="text-muted hover:text-amber disabled:opacity-50">
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

/* ───────────────────────── Pakej Jimat ───────────────────────── */
function PakejSettings({ settings, run, busy, supabase }: { settings: Settings; run: Run; busy: boolean; supabase: SB }) {
  const [percent, setPercent] = useState(String(settings.pakej_discount_percent));
  const [minItems, setMinItems] = useState(String(settings.pakej_min_items));

  const save = () =>
    run(async () => {
      const { error } = await supabase
        .from("shop_settings")
        .update({ pakej_discount_percent: num(percent), pakej_min_items: num(minItems) })
        .eq("id", 1);
      if (error) throw new Error(error.message);
    });

  return (
    <div className={cardCls}>
      <h3 className={`${sectionTitle} mb-4`}>Pakej Jimat</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={labelCls}>Diskaun (%)</label>
          <input type="number" min="0" max="100" className={inputCls} value={percent} onChange={(e) => setPercent(e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Minimum item untuk diskaun</label>
          <input type="number" min="1" className={inputCls} value={minItems} onChange={(e) => setMinItems(e.target.value)} />
        </div>
      </div>
      <button type="button" onClick={save} disabled={busy} className={`${btnCls} mt-4`}>
        Simpan Pakej Jimat
      </button>
    </div>
  );
}
