"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Trash2, Plus, Paperclip, X } from "lucide-react";
import { createPublicSupabase } from "@/lib/supabase/public";
import { compressImage } from "@/lib/image-compress";
import { useLang } from "@/lib/i18n";
import {
  KID_SIZES,
  ADULT_SIZES,
  unitPrice,
  ringgit,
  type PriceProduct,
} from "@/lib/shop";

type Product = {
  id: string;
  name: string;
  base_price: number | string;
  big_size_surcharge: number | string;
  kid_discount: number | string;
  name_print_enabled: boolean;
  name_print_fee: number | string;
};
type Variant = {
  id: string;
  label: string;
  price: number | string;
  reka_bentuk: string | null;
  lengan: string | null;
  material: string | null;
};
type Edition = { id: string; name: string; year: string | null; price: number | string };
type Settings = {
  pakej_discount_percent: number;
  pakej_min_items: number;
  duitnow_qr_url: string | null;
  info_akaun: string | null;
};
type CartItem = {
  key: string;
  category: "jersi" | "hustle_gear" | "jersi_lama";
  label: string;
  reka_bentuk?: string | null;
  lengan?: string | null;
  material?: string | null;
  edition_id?: string;
  size: string;
  qty: number;
  name_print: boolean;
  unit: number;
};

const inputCls =
  "w-full rounded-lg border border-line bg-ink px-3 py-2.5 font-sans text-sm text-paper placeholder:text-muted/60 outline-none focus:border-amber";
const labelCls = "mb-1.5 block font-sans text-xs text-muted";
const addBtn =
  "inline-flex items-center justify-center gap-1.5 rounded-full bg-amber px-5 py-2.5 font-sans text-sm font-semibold uppercase tracking-wider text-ink transition-colors hover:bg-amber-deep disabled:opacity-50";

const vLabel = (v: Variant) =>
  [v.reka_bentuk, v.lengan, v.material].filter(Boolean).join(" · ") || v.label;

function SizeSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { t } = useLang();
  return (
    <select className={inputCls} value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">{t("Pilih saiz…", "Choose size…")}</option>
      <optgroup label={t("Saiz Kanak (24–32)", "Kids (24–32)")}>
        {KID_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
      </optgroup>
      <optgroup label={t("Saiz Dewasa", "Adult")}>
        {ADULT_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
      </optgroup>
    </select>
  );
}

export default function OrderShop({
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
  const { t } = useLang();
  const supabase = useMemo(() => createPublicSupabase(), []);
  const jersi = products.find((p) => p.id === "jersi");
  const hustle = products.find((p) => p.id === "hustle_gear");
  const jersiPP: PriceProduct = jersi ?? { big_size_surcharge: 0, kid_discount: 0 };
  const hustlePP: PriceProduct = hustle ?? { big_size_surcharge: 0, kid_discount: 0 };

  const tabs = [
    { id: "jersi", label: t("Jersi", "Jersey") },
    { id: "hustle_gear", label: "Hustle Gear" },
    { id: "jersi_lama", label: t("Jersi Lama", "Old Jerseys") },
    { id: "pakej", label: t("Pakej Jimat", "Bundle") },
  ];
  const [tab, setTab] = useState("jersi");
  const [cart, setCart] = useState<CartItem[]>([]);

  const addItem = (it: Omit<CartItem, "key">) =>
    setCart((c) => [...c, { ...it, key: crypto.randomUUID() }]);
  const removeItem = (key: string) => setCart((c) => c.filter((i) => i.key !== key));

  const totalQty = cart.reduce((s, i) => s + i.qty, 0);
  const subtotal = cart.reduce((s, i) => s + i.unit * i.qty, 0);
  const discountOn = settings.pakej_discount_percent > 0 && totalQty >= settings.pakej_min_items;
  const discount = discountOn ? (subtotal * settings.pakej_discount_percent) / 100 : 0;
  const total = subtotal - discount;

  return (
    <section className="bg-ink py-20 sm:py-28">
      <div className="mx-auto max-w-3xl px-6">
        <div className="text-center">
          <span className="font-sans text-sm font-semibold uppercase tracking-[0.3em] text-amber">
            Stingers Hockey
          </span>
          <h1 className="display mt-4 text-5xl text-paper sm:text-6xl">
            {t("Tempahan Pasukan", "Team Order")}
          </h1>
          <p className="mx-auto mt-4 max-w-xl font-sans text-base text-muted">
            {t(
              "Pilih item, tambah ke senarai, dan sahkan tempahan anda.",
              "Pick items, add to your list, and confirm your order."
            )}
          </p>
        </div>

        {/* Tab (atas) */}
        <div className="mt-10 flex flex-wrap gap-2">
          {tabs.map((tb) => (
            <button
              key={tb.id}
              type="button"
              onClick={() => setTab(tb.id)}
              className={`rounded-full px-4 py-2 font-sans text-sm font-semibold transition-colors ${
                tab === tb.id ? "bg-amber text-ink" : "bg-bg-soft text-paper hover:bg-bg-soft/70"
              }`}
            >
              {tb.label}
              {tb.id === "pakej" && cart.length > 0 ? ` (${cart.length})` : ""}
            </button>
          ))}
        </div>

        {/* Panel (tiada garis pemisah) */}
        <div className="mt-5 rounded-2xl bg-bg-soft/50 p-6 sm:p-8">
          {tab === "jersi" && (
            <JersiConfig variants={variants} pp={jersiPP} jersi={jersi} onAdd={addItem} />
          )}
          {tab === "hustle_gear" && <HustleConfig pp={hustlePP} hustle={hustle} onAdd={addItem} />}
          {tab === "jersi_lama" && (
            <EditionConfig editions={editions} pp={jersiPP} jersi={jersi} onAdd={addItem} />
          )}
          {tab === "pakej" && (
            <Checkout
              cart={cart}
              removeItem={removeItem}
              clearCart={() => setCart([])}
              subtotal={subtotal}
              discount={discount}
              discountOn={discountOn}
              total={total}
              totalQty={totalQty}
              settings={settings}
              supabase={supabase}
            />
          )}
        </div>

        {/* Ringkasan senarai (selain tab pakej) */}
        {tab !== "pakej" && cart.length > 0 && (
          <button
            type="button"
            onClick={() => setTab("pakej")}
            className="mt-4 flex w-full items-center justify-between rounded-xl border border-amber/40 bg-amber/10 px-5 py-3 text-left transition-colors hover:bg-amber/20"
          >
            <span className="font-sans text-sm text-paper">
              {cart.length} {t("item dalam senarai", "items in list")} · {ringgit(total)}
            </span>
            <span className="font-sans text-sm font-semibold text-amber">
              {t("Sahkan →", "Confirm →")}
            </span>
          </button>
        )}
      </div>
    </section>
  );
}

/* ───────────────── Konfigurator Jersi ───────────────── */
function JersiConfig({
  variants,
  pp,
  jersi,
  onAdd,
}: {
  variants: Variant[];
  pp: PriceProduct;
  jersi?: Product;
  onAdd: (i: Omit<CartItem, "key">) => void;
}) {
  const { t } = useLang();
  const [variantId, setVariantId] = useState("");
  const [size, setSize] = useState("");
  const [qty, setQty] = useState(1);
  const [namePrint, setNamePrint] = useState(false);
  const v = variants.find((x) => x.id === variantId);
  const unit = v && size ? unitPrice(v.price, size, pp, namePrint) : 0;

  if (variants.length === 0)
    return <p className="font-sans text-sm text-muted">{t("Belum ada jersi ditawarkan.", "No jerseys available yet.")}</p>;

  const add = () => {
    if (!v || !size) return;
    onAdd({
      category: "jersi",
      label: vLabel(v),
      reka_bentuk: v.reka_bentuk,
      lengan: v.lengan,
      material: v.material,
      size,
      qty,
      name_print: namePrint,
      unit,
    });
    setVariantId("");
    setSize("");
    setQty(1);
    setNamePrint(false);
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className={labelCls}>{t("Jenis jersi", "Jersey type")}</label>
        <select className={inputCls} value={variantId} onChange={(e) => setVariantId(e.target.value)}>
          <option value="">{t("Pilih jenis…", "Choose type…")}</option>
          {variants.map((x) => (
            <option key={x.id} value={x.id}>
              {vLabel(x)} — {ringgit(Number(x.price) || 0)}
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls}>{t("Saiz", "Size")}</label>
          <SizeSelect value={size} onChange={setSize} />
        </div>
        <div>
          <label className={labelCls}>{t("Kuantiti", "Quantity")}</label>
          <input type="number" min={1} max={100} className={inputCls} value={qty} onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))} />
        </div>
      </div>
      {jersi?.name_print_enabled && (
        <label className="flex items-center gap-2 font-sans text-sm text-paper/90">
          <input type="checkbox" className="h-4 w-4 accent-amber" checked={namePrint} onChange={(e) => setNamePrint(e.target.checked)} />
          {t("Cetak nama & nombor", "Print name & number")} (+{ringgit(Number(jersi.name_print_fee) || 0)})
        </label>
      )}
      <div className="flex items-center justify-between">
        <span className="font-sans text-sm text-muted">
          {t("Seunit", "Unit")}: <span className="font-semibold text-amber">{ringgit(unit)}</span>
        </span>
        <button type="button" onClick={add} disabled={!v || !size} className={addBtn}>
          <Plus className="h-4 w-4" /> {t("Tambah", "Add")}
        </button>
      </div>
    </div>
  );
}

/* ───────────────── Konfigurator Hustle Gear ───────────────── */
function HustleConfig({ pp, hustle, onAdd }: { pp: PriceProduct; hustle?: Product; onAdd: (i: Omit<CartItem, "key">) => void }) {
  const { t } = useLang();
  const [size, setSize] = useState("");
  const [qty, setQty] = useState(1);
  const base = hustle?.base_price ?? 0;
  const unit = size ? unitPrice(base, size, pp, false) : 0;

  const add = () => {
    if (!size) return;
    onAdd({ category: "hustle_gear", label: "Hustle Gear", size, qty, name_print: false, unit });
    setSize("");
    setQty(1);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls}>{t("Saiz", "Size")}</label>
          <SizeSelect value={size} onChange={setSize} />
        </div>
        <div>
          <label className={labelCls}>{t("Kuantiti", "Quantity")}</label>
          <input type="number" min={1} max={100} className={inputCls} value={qty} onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))} />
        </div>
      </div>
      <div className="flex items-center justify-between">
        <span className="font-sans text-sm text-muted">
          {t("Seunit", "Unit")}: <span className="font-semibold text-amber">{ringgit(unit)}</span>
        </span>
        <button type="button" onClick={add} disabled={!size} className={addBtn}>
          <Plus className="h-4 w-4" /> {t("Tambah", "Add")}
        </button>
      </div>
    </div>
  );
}

/* ───────────────── Konfigurator Jersi Lama ───────────────── */
function EditionConfig({
  editions,
  pp,
  jersi,
  onAdd,
}: {
  editions: Edition[];
  pp: PriceProduct;
  jersi?: Product;
  onAdd: (i: Omit<CartItem, "key">) => void;
}) {
  const { t } = useLang();
  const [editionId, setEditionId] = useState("");
  const [size, setSize] = useState("");
  const [qty, setQty] = useState(1);
  const [namePrint, setNamePrint] = useState(false);
  const ed = editions.find((x) => x.id === editionId);
  const unit = ed && size ? unitPrice(ed.price, size, pp, namePrint) : 0;

  if (editions.length === 0)
    return <p className="font-sans text-sm text-muted">{t("Tiada jersi lama untuk dijual buat masa ini.", "No old jerseys for sale right now.")}</p>;

  const add = () => {
    if (!ed || !size) return;
    onAdd({
      category: "jersi_lama",
      label: `${ed.name}${ed.year ? ` ${ed.year}` : ""}`,
      edition_id: ed.id,
      size,
      qty,
      name_print: namePrint,
      unit,
    });
    setEditionId("");
    setSize("");
    setQty(1);
    setNamePrint(false);
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className={labelCls}>{t("Edisi", "Edition")}</label>
        <select className={inputCls} value={editionId} onChange={(e) => setEditionId(e.target.value)}>
          <option value="">{t("Pilih edisi…", "Choose edition…")}</option>
          {editions.map((x) => (
            <option key={x.id} value={x.id}>
              {x.name} {x.year} — {ringgit(Number(x.price) || 0)}
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls}>{t("Saiz", "Size")}</label>
          <SizeSelect value={size} onChange={setSize} />
        </div>
        <div>
          <label className={labelCls}>{t("Kuantiti", "Quantity")}</label>
          <input type="number" min={1} max={100} className={inputCls} value={qty} onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))} />
        </div>
      </div>
      {jersi?.name_print_enabled && (
        <label className="flex items-center gap-2 font-sans text-sm text-paper/90">
          <input type="checkbox" className="h-4 w-4 accent-amber" checked={namePrint} onChange={(e) => setNamePrint(e.target.checked)} />
          {t("Cetak nama & nombor", "Print name & number")} (+{ringgit(Number(jersi.name_print_fee) || 0)})
        </label>
      )}
      <div className="flex items-center justify-between">
        <span className="font-sans text-sm text-muted">
          {t("Seunit", "Unit")}: <span className="font-semibold text-amber">{ringgit(unit)}</span>
        </span>
        <button type="button" onClick={add} disabled={!ed || !size} className={addBtn}>
          <Plus className="h-4 w-4" /> {t("Tambah", "Add")}
        </button>
      </div>
    </div>
  );
}

/* ───────────────── Senarai + Pengesahan ───────────────── */
function Checkout({
  cart,
  removeItem,
  clearCart,
  subtotal,
  discount,
  discountOn,
  total,
  totalQty,
  settings,
  supabase,
}: {
  cart: CartItem[];
  removeItem: (k: string) => void;
  clearCart: () => void;
  subtotal: number;
  discount: number;
  discountOn: boolean;
  total: number;
  totalQty: number;
  settings: Settings;
  supabase: ReturnType<typeof createPublicSupabase>;
}) {
  const { t } = useLang();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      setError(t("Sila pilih gambar.", "Please choose an image."));
      return;
    }
    setError(null);
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const submit = async () => {
    setError(null);
    if (cart.length === 0) return setError(t("Senarai kosong.", "Your list is empty."));
    if (fullName.trim().length < 3) return setError(t("Sila masukkan nama penuh.", "Please enter your full name."));
    if (phone.trim().length < 9) return setError(t("Sila masukkan no. telefon sah.", "Please enter a valid phone."));
    if (!file) return setError(t("Sila muat naik bukti pindahan.", "Please upload your transfer proof."));
    setSaving(true);
    try {
      const compressed = await compressImage(file);
      const ext = compressed.name.split(".").pop() || "jpg";
      const path = `proof/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("shop")
        .upload(path, compressed, { upsert: false, contentType: compressed.type });
      if (upErr) throw new Error(t("Gagal muat naik bukti.", "Failed to upload proof."));
      const proofUrl = supabase.storage.from("shop").getPublicUrl(path).data.publicUrl;

      const categories = new Set(cart.map((i) => i.category));
      const { error: insErr } = await supabase.from("shop_orders").insert({
        category: categories.size === 1 ? [...categories][0] : "pakej",
        full_name: fullName.trim().toUpperCase(),
        phone: phone.trim(),
        email: email.trim() || null,
        items: cart.map(({ key, ...rest }) => { void key; return rest; }),
        subtotal,
        discount,
        total,
        proof_url: proofUrl,
      });
      if (insErr) throw new Error(insErr.message);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("Gagal hantar.", "Failed to submit."));
      setSaving(false);
      return;
    }
    setSaving(false);
    setDone(true);
    clearCart();
  };

  if (done) {
    return (
      <div className="flex flex-col items-center gap-4 py-10 text-center">
        <CheckCircle2 className="h-14 w-14 text-amber" />
        <h3 className="display text-3xl text-paper">{t("Tempahan Diterima!", "Order Received!")}</h3>
        <p className="max-w-md font-sans text-muted">
          {t(
            "Terima kasih. Tempahan anda akan disemak. Kami akan hubungi anda untuk pengesahan.",
            "Thank you. Your order will be reviewed. We'll contact you to confirm."
          )}
        </p>
      </div>
    );
  }

  if (cart.length === 0)
    return <p className="py-6 text-center font-sans text-sm text-muted">{t("Senarai anda kosong. Tambah item dari tab di atas.", "Your list is empty. Add items from the tabs above.")}</p>;

  return (
    <div className="flex flex-col gap-6">
      {/* Senarai */}
      <ul className="flex flex-col gap-2">
        {cart.map((i) => (
          <li key={i.key} className="flex items-center gap-3 rounded-lg border border-line bg-ink/40 px-3 py-2.5">
            <div className="min-w-0 flex-1">
              <p className="truncate font-sans text-sm font-medium text-paper">
                {i.label} · {i.size} × {i.qty}
                {i.name_print ? ` · ${t("cetak nama", "name print")}` : ""}
              </p>
              <p className="font-sans text-xs text-muted">{ringgit(i.unit)} {t("seunit", "each")}</p>
            </div>
            <span className="shrink-0 font-sans text-sm font-semibold text-amber">{ringgit(i.unit * i.qty)}</span>
            <button type="button" onClick={() => removeItem(i.key)} aria-label="Buang" className="shrink-0 text-muted hover:text-amber">
              <Trash2 className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>

      {/* Jumlah */}
      <div className="rounded-xl border border-amber/40 bg-amber/10 px-5 py-4">
        <div className="flex justify-between font-sans text-sm text-paper/90">
          <span>{t("Subjumlah", "Subtotal")} ({totalQty})</span>
          <span>{ringgit(subtotal)}</span>
        </div>
        {discountOn && (
          <div className="mt-1 flex justify-between font-sans text-sm text-paper/90">
            <span>{t("Diskaun Pakej Jimat", "Bundle discount")} ({settings.pakej_discount_percent}%)</span>
            <span>− {ringgit(discount)}</span>
          </div>
        )}
        {!discountOn && settings.pakej_discount_percent > 0 && (
          <p className="mt-1 font-sans text-xs text-muted">
            {t(
              `Tambah ${Math.max(0, settings.pakej_min_items - totalQty)} item lagi untuk diskaun ${settings.pakej_discount_percent}%.`,
              `Add ${Math.max(0, settings.pakej_min_items - totalQty)} more for ${settings.pakej_discount_percent}% off.`
            )}
          </p>
        )}
        <div className="mt-2 flex items-center justify-between border-t border-amber/30 pt-2">
          <span className="font-sans text-sm font-semibold text-paper">{t("Jumlah", "Total")}</span>
          <span className="display text-2xl text-amber">{ringgit(total)}</span>
        </div>
      </div>

      {/* Maklumat penempah */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={labelCls}>{t("Nama Penuh *", "Full Name *")}</label>
          <input className={`${inputCls} uppercase`} value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="CONTOH BIN CONTOH" />
        </div>
        <div>
          <label className={labelCls}>{t("No. Telefon *", "Phone *")}</label>
          <input className={inputCls} inputMode="numeric" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0123456789" />
        </div>
        <div>
          <label className={labelCls}>Email</label>
          <input className={inputCls} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t("(pilihan)", "(optional)")} />
        </div>
      </div>

      {/* DuitNow QR + akaun */}
      <div className="rounded-xl border border-line bg-ink/40 p-5">
        <p className="mb-3 font-sans text-sm font-semibold text-paper">
          {t("Imbas QR DuitNow & pindahkan jumlah di atas", "Scan the DuitNow QR & transfer the total above")}
        </p>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          {settings.duitnow_qr_url ? (
            // eslint-disable-next-line @next/next/no-img-element -- QR dari Storage
            <img src={settings.duitnow_qr_url} alt="QR DuitNow" className="h-44 w-44 shrink-0 rounded-lg border border-line bg-paper object-contain p-2" />
          ) : (
            <div className="flex h-44 w-44 shrink-0 items-center justify-center rounded-lg border border-dashed border-line font-sans text-xs text-muted">
              {t("QR belum disediakan", "QR not set yet")}
            </div>
          )}
          {settings.info_akaun && (
            <p className="whitespace-pre-wrap font-sans text-sm text-paper/90">{settings.info_akaun}</p>
          )}
        </div>
      </div>

      {/* Muat naik bukti */}
      <div>
        <label className={labelCls}>{t("Muat naik bukti pindahan *", "Upload transfer proof *")}</label>
        {preview ? (
          <div className="relative inline-block">
            {/* eslint-disable-next-line @next/next/no-img-element -- pratonton */}
            <img src={preview} alt="" className="max-h-56 rounded-lg border border-line" />
            <button type="button" onClick={() => { setFile(null); setPreview(null); }} aria-label="Buang" className="absolute right-2 top-2 rounded-full bg-ink/80 p-1.5 text-paper hover:bg-ink">
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <label className="flex cursor-pointer items-center gap-2 self-start rounded-lg border border-dashed border-line px-4 py-3 font-sans text-sm text-muted transition-colors hover:border-amber hover:text-amber">
            <Paperclip className="h-4 w-4" />
            {t("Pilih gambar bukti", "Choose proof image")}
            <input type="file" accept="image/*" onChange={onPick} className="hidden" />
          </label>
        )}
      </div>

      {error && <p className="font-sans text-sm text-amber">{error}</p>}

      <div className="flex flex-col gap-3 sm:flex-row">
        <button type="button" onClick={submit} disabled={saving} className="flex-1 rounded-full bg-amber px-6 py-3 font-sans text-sm font-semibold uppercase tracking-wider text-ink transition-colors hover:bg-amber-deep disabled:opacity-60">
          {saving ? t("Menghantar…", "Submitting…") : t("Hantar Tempahan", "Submit Order")}
        </button>
        <button type="button" onClick={() => { if (confirm(t("Batal & buang semua tempahan?", "Cancel & clear all items?"))) clearCart(); }} className="rounded-full border border-line px-6 py-3 font-sans text-sm font-medium text-paper transition-colors hover:border-amber">
          {t("Batal", "Cancel")}
        </button>
      </div>
    </div>
  );
}
