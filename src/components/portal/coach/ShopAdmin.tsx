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

type Product = {
  id: string;
  name: string;
  image_url: string | null;
  base_price: number | string;
  big_size_surcharge: number | string;
  kid_discount: number | string;
  name_print_enabled: boolean;
  name_print_fee: number | string;
};
type Variant = { id: string; product_id: string; label: string; price: number | string; sort_order: number };
type Edition = {
  id: string;
  name: string;
  year: string | null;
  image_url: string | null;
  price: number | string;
  for_sale: boolean;
  sort_order: number;
};
type Settings = { pakej_discount_percent: number; pakej_min_items: number };

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
          uploadImage={uploadImage}
          run={run}
          busy={busy}
          supabase={supabase}
        />
      )}

      <EditionsEditor
        editions={editions}
        uploadImage={uploadImage}
        run={run}
        busy={busy}
        supabase={supabase}
      />

      <PakejSettings settings={settings} run={run} busy={busy} supabase={supabase} />
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
  uploadImage,
  run,
  busy,
  supabase,
  children,
}: {
  title: string;
  product: Product;
  showBasePrice: boolean;
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
  const [label, setLabel] = useState("");
  const [price, setPrice] = useState("");

  const add = () =>
    run(async () => {
      if (label.trim() === "") throw new Error("Sila masukkan label variasi.");
      const { error } = await supabase.from("shop_variants").insert({
        product_id: productId,
        label: label.trim(),
        price: num(price),
        sort_order: variants.length,
      });
      if (error) throw new Error(error.message);
      setLabel("");
      setPrice("");
    });

  const del = (id: string) =>
    run(async () => {
      const { error } = await supabase.from("shop_variants").delete().eq("id", id);
      if (error) throw new Error(error.message);
    });

  return (
    <div className="mt-5 border-t border-line pt-4">
      <p className={labelCls}>Jenis jersi (variasi) — label + harga penuh</p>
      {variants.length > 0 && (
        <ul className="mb-3 flex flex-col gap-1.5">
          {variants.map((v) => (
            <li key={v.id} className="flex items-center gap-2 rounded-lg border border-line bg-ink/40 px-3 py-2">
              <span className="min-w-0 flex-1 truncate font-sans text-sm text-paper">{v.label}</span>
              <span className="shrink-0 font-sans text-sm font-semibold text-amber">{ringgit(num(v.price))}</span>
              <button type="button" onClick={() => del(v.id)} disabled={busy} aria-label="Padam" className="shrink-0 text-muted hover:text-amber">
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-col gap-2 sm:flex-row">
        <input className={`${inputCls} sm:flex-1`} placeholder="Cth: Berkolar lengan panjang Lycra" value={label} onChange={(e) => setLabel(e.target.value)} />
        <input type="number" step="0.01" min="0" className={`${inputCls} sm:w-32`} placeholder="Harga" value={price} onChange={(e) => setPrice(e.target.value)} />
        <button type="button" onClick={add} disabled={busy} className="inline-flex shrink-0 items-center justify-center gap-1 rounded-lg border border-line px-3 py-2 font-sans text-xs font-semibold text-paper hover:border-amber hover:text-amber disabled:opacity-50">
          <Plus className="h-4 w-4" /> Tambah
        </button>
      </div>
    </div>
  );
}

/* ───────────────────────── Jersi Lama (edisi) ───────────────────────── */
function EditionsEditor({
  editions,
  uploadImage,
  run,
  busy,
  supabase,
}: {
  editions: Edition[];
  uploadImage: (f: File) => Promise<string>;
  run: Run;
  busy: boolean;
  supabase: SB;
}) {
  return (
    <div className={cardCls}>
      <h3 className={`${sectionTitle} mb-1`}>Jersi Lama (Edisi Legasi)</h3>
      <p className="mb-4 font-sans text-xs text-muted">
        Set harga & tanda &ldquo;boleh beli&rdquo; untuk edisi yang ditawarkan cetak semula.
      </p>
      <div className="flex flex-col gap-2">
        {editions.map((ed) => (
          <EditionRow key={ed.id} edition={ed} uploadImage={uploadImage} run={run} busy={busy} supabase={supabase} />
        ))}
      </div>
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
