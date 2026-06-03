"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Trash2, Plus, Paperclip, X, Ruler } from "lucide-react";
import { createPublicSupabase } from "@/lib/supabase/public";
import { compressImage } from "@/lib/image-compress";
import { useLang } from "@/lib/i18n";
import {
  KID_SIZES,
  ADULT_SIZES,
  unitPrice,
  ringgit,
  computePostage,
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
  number_print_enabled?: boolean;
  number_print_fee?: number | string;
  size_charts?: Record<string, string> | null;
};

const JERSI_CHARTS = [
  { key: "lengan_pendek", label: "Lengan Pendek" },
  { key: "lengan_panjang", label: "Lengan Panjang" },
  { key: "muslimah", label: "Muslimah" },
];
const HUSTLE_CHARTS = [{ key: "standard", label: "Carta Saiz" }];
type Variant = {
  id: string;
  label: string;
  price: number | string;
  reka_bentuk: string | null;
  penutup: string | null;
  lengan: string | null;
  material: string | null;
};
type Edition = { id: string; name: string; year: string | null; price: number | string; kind: string | null };
type Settings = {
  pakej_discount_percent: number;
  pakej_min_items: number;
  duitnow_qr_url: string | null;
  info_akaun: string | null;
  pos_enabled?: boolean;
  pos_weight_per_item_g?: number | string;
  pos_base?: number | string;
  pos_base_kg?: number | string;
  pos_add_per_kg?: number | string;
};
type CartItem = {
  key: string;
  category: "jersi" | "hustle_gear" | "jersi_lama" | "hustle_lama";
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

const inputCls =
  "w-full rounded-lg border border-line bg-ink px-3 py-2.5 font-sans text-sm text-paper placeholder:text-muted/60 outline-none focus:border-amber";
const labelCls = "mb-1.5 block font-sans text-xs text-muted";
const addBtn =
  "inline-flex items-center justify-center gap-1.5 rounded-full bg-amber px-5 py-2.5 font-sans text-sm font-semibold uppercase tracking-wider text-ink transition-colors hover:bg-amber-deep disabled:opacity-50";

const vLabel = (v: Variant) =>
  [v.reka_bentuk, v.penutup, v.lengan, v.material].filter(Boolean).join(" · ") || v.label;

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

function SizeChartViewer({
  charts,
  keys,
}: {
  charts?: Record<string, string> | null;
  keys: { key: string; label: string }[];
}) {
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const [sel, setSel] = useState(0);
  const avail = keys.filter((k) => charts?.[k.key]);
  if (avail.length === 0) return null;
  const cur = avail[Math.min(sel, avail.length - 1)];
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 font-sans text-sm font-semibold text-amber transition-colors hover:text-amber-deep"
      >
        <Ruler className="h-4 w-4" /> {t("Carta Saiz", "Size Chart")}
      </button>
      {open && (
        <div className="mt-2 rounded-lg border border-line bg-ink/40 p-3">
          {avail.length > 1 && (
            <div className="mb-2 flex flex-wrap gap-1.5">
              {avail.map((k, i) => (
                <button
                  key={k.key}
                  type="button"
                  onClick={() => setSel(i)}
                  className={`rounded-full px-3 py-1 font-sans text-xs font-semibold ${
                    i === sel ? "bg-amber text-ink" : "border border-line text-paper"
                  }`}
                >
                  {k.label}
                </button>
              ))}
            </div>
          )}
          <a href={charts![cur.key]} target="_blank" rel="noopener noreferrer">
            {/* eslint-disable-next-line @next/next/no-img-element -- carta dari Storage */}
            <img src={charts![cur.key]} alt={cur.label} className="max-h-[70vh] w-full rounded-md bg-paper object-contain" />
          </a>
        </div>
      )}
    </div>
  );
}

// Input cetak nama / nombor — tulis teks; isi = nak cetak (+fi).
function PrintInputs({
  prod,
  name,
  setName,
  number,
  setNumber,
}: {
  prod?: Product;
  name: string;
  setName: (v: string) => void;
  number: string;
  setNumber: (v: string) => void;
}) {
  const { t } = useLang();
  return (
    <>
      {prod?.name_print_enabled && (
        <div>
          <label className={labelCls}>
            {t("Cetak nama", "Print name")} (+{ringgit(Number(prod.name_print_fee) || 0)})
          </label>
          <input
            className={`${inputCls} uppercase`}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("Nama untuk dicetak (kosongkan jika tak nak)", "Name to print (blank to skip)")}
          />
        </div>
      )}
      {prod?.number_print_enabled && (
        <div>
          <label className={labelCls}>
            {t("Cetak nombor", "Print number")} (+{ringgit(Number(prod.number_print_fee) || 0)})
          </label>
          <input
            className={inputCls}
            inputMode="numeric"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            placeholder={t("Nombor (kosongkan jika tak nak)", "Number (blank to skip)")}
          />
        </div>
      )}
    </>
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

  // Hanya tunjuk tab produk yang benar-benar disediakan oleh admin.
  const hasJersi = variants.length > 0;
  const hasHustle = !!hustle && Number(hustle.base_price) > 0;
  const hasLama = editions.length > 0;
  const noProducts = !hasJersi && !hasHustle && !hasLama;
  const tabs = [
    ...(hasJersi ? [{ id: "jersi", label: t("Jersi", "Jersey") }] : []),
    ...(hasHustle ? [{ id: "hustle_gear", label: "Hustle Gear" }] : []),
    ...(hasLama ? [{ id: "jersi_lama", label: t("Koleksi Lama", "Past Collection") }] : []),
    { id: "pakej", label: t("Pakej Jimat", "Bundle") },
  ];
  const [tab, setTab] = useState(tabs[0]?.id ?? "pakej");
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
    <section className="bg-ink pt-32 pb-20 sm:pt-40 sm:pb-28">
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

        {noProducts ? (
          <p className="mt-10 rounded-2xl bg-bg-soft/50 p-10 text-center font-sans text-base text-muted">
            {t("Kedai belum dibuka buat masa ini. Sila kembali lagi nanti.", "The shop isn't open yet. Please check back later.")}
          </p>
        ) : (
          <>
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
            <EditionConfig editions={editions} jersi={jersi} hustle={hustle} jersiPP={jersiPP} hustlePP={hustlePP} onAdd={addItem} />
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
          </>
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
  const [printName, setPrintName] = useState("");
  const [printNumber, setPrintNumber] = useState("");
  const v = variants.find((x) => x.id === variantId);
  const nameOn = printName.trim() !== "";
  const numberOn = printNumber.trim() !== "";
  const unit = v && size ? unitPrice(v.price, size, pp, nameOn, numberOn) : 0;

  if (variants.length === 0)
    return <p className="font-sans text-sm text-muted">{t("Belum ada jersi ditawarkan.", "No jerseys available yet.")}</p>;

  const add = () => {
    if (!v || !size) return;
    onAdd({
      category: "jersi",
      label: vLabel(v),
      reka_bentuk: v.reka_bentuk,
      penutup: v.penutup,
      lengan: v.lengan,
      material: v.material,
      size,
      qty,
      print_name: printName.trim() || null,
      print_number: printNumber.trim() || null,
      unit,
    });
    setVariantId("");
    setSize("");
    setQty(1);
    setPrintName("");
    setPrintNumber("");
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
      <SizeChartViewer charts={jersi?.size_charts} keys={JERSI_CHARTS} />
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
      <PrintInputs prod={jersi} name={printName} setName={setPrintName} number={printNumber} setNumber={setPrintNumber} />
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
  const [printName, setPrintName] = useState("");
  const base = hustle?.base_price ?? 0;
  const unit = size ? unitPrice(base, size, pp, printName.trim() !== "") : 0;

  const add = () => {
    if (!size) return;
    onAdd({ category: "hustle_gear", label: "Hustle Gear", size, qty, print_name: printName.trim() || null, print_number: null, unit });
    setSize("");
    setQty(1);
    setPrintName("");
  };

  return (
    <div className="flex flex-col gap-4">
      <SizeChartViewer charts={hustle?.size_charts} keys={HUSTLE_CHARTS} />
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
      <PrintInputs prod={hustle} name={printName} setName={setPrintName} number="" setNumber={() => {}} />
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
  jersi,
  hustle,
  jersiPP,
  hustlePP,
  onAdd,
}: {
  editions: Edition[];
  jersi?: Product;
  hustle?: Product;
  jersiPP: PriceProduct;
  hustlePP: PriceProduct;
  onAdd: (i: Omit<CartItem, "key">) => void;
}) {
  const { t } = useLang();
  const [editionId, setEditionId] = useState("");
  const [size, setSize] = useState("");
  const [qty, setQty] = useState(1);
  const [printName, setPrintName] = useState("");
  const [printNumber, setPrintNumber] = useState("");
  const ed = editions.find((x) => x.id === editionId);
  // Guna tetapan produk ikut jenis edisi (jersi vs hustle gear).
  const isHustle = ed?.kind === "hustle_gear";
  const prod = isHustle ? hustle : jersi;
  const pp = isHustle ? hustlePP : jersiPP;
  const nameOn = printName.trim() !== "";
  const numberOn = printNumber.trim() !== "";
  const unit = ed && size ? unitPrice(ed.price, size, pp, nameOn, numberOn) : 0;

  if (editions.length === 0)
    return <p className="font-sans text-sm text-muted">{t("Tiada koleksi lama untuk dijual buat masa ini.", "No past collection for sale right now.")}</p>;

  const add = () => {
    if (!ed || !size) return;
    onAdd({
      category: isHustle ? "hustle_lama" : "jersi_lama",
      label: `${ed.name}${ed.year ? ` ${ed.year}` : ""}`,
      edition_id: ed.id,
      size,
      qty,
      print_name: printName.trim() || null,
      print_number: printNumber.trim() || null,
      unit,
    });
    setEditionId("");
    setSize("");
    setQty(1);
    setPrintName("");
    setPrintNumber("");
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className={labelCls}>{t("Edisi", "Edition")}</label>
        <select className={inputCls} value={editionId} onChange={(e) => setEditionId(e.target.value)}>
          <option value="">{t("Pilih edisi…", "Choose edition…")}</option>
          {editions.map((x) => (
            <option key={x.id} value={x.id}>
              {x.name} {x.year}{x.kind === "hustle_gear" ? " (Hustle Gear)" : ""} — {ringgit(Number(x.price) || 0)}
            </option>
          ))}
        </select>
      </div>
      <SizeChartViewer charts={prod?.size_charts} keys={isHustle ? HUSTLE_CHARTS : JERSI_CHARTS} />
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
      <PrintInputs prod={prod} name={printName} setName={setPrintName} number={printNumber} setNumber={setPrintNumber} />
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
  const [delivery, setDelivery] = useState<"pickup" | "pos">("pickup");
  const [address, setAddress] = useState("");
  const posOn = !!settings.pos_enabled;
  const postage = posOn && delivery === "pos" ? computePostage(totalQty, settings) : 0;
  const grand = total + postage;

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
    if (posOn && delivery === "pos" && address.trim().length < 5)
      return setError(t("Sila masukkan alamat penghantaran.", "Please enter your delivery address."));
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
        delivery: posOn ? delivery : "pickup",
        postage,
        address: posOn && delivery === "pos" ? address.trim() : null,
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
                {i.print_name ? ` · ${t("Nama", "Name")}: ${i.print_name}` : ""}
                {i.print_number ? ` · ${t("No", "No")}: ${i.print_number}` : ""}
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

      {/* Cara terima (Pos / Ambil sendiri) */}
      {posOn && (
        <div className="rounded-xl border border-line bg-ink/40 p-4">
          <p className={labelCls}>{t("Cara terima", "Delivery")}</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setDelivery("pickup")}
              className={`rounded-full px-4 py-1.5 font-sans text-sm font-semibold ${delivery === "pickup" ? "bg-amber text-ink" : "border border-line text-paper"}`}
            >
              {t("Ambil sendiri", "Self-pickup")}
            </button>
            <button
              type="button"
              onClick={() => setDelivery("pos")}
              className={`rounded-full px-4 py-1.5 font-sans text-sm font-semibold ${delivery === "pos" ? "bg-amber text-ink" : "border border-line text-paper"}`}
            >
              {t("Pos", "Postage")}
            </button>
          </div>
          {delivery === "pos" && (
            <div className="mt-3">
              <label className={labelCls}>{t("Alamat penghantaran *", "Delivery address *")}</label>
              <textarea
                rows={3}
                className={`${inputCls} resize-y`}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder={t("Alamat penuh + poskod", "Full address + postcode")}
              />
            </div>
          )}
        </div>
      )}

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
        {posOn && delivery === "pos" && (
          <div className="mt-1 flex justify-between font-sans text-sm text-paper/90">
            <span>{t("Penghantaran (Pos)", "Postage")}</span>
            <span>+ {ringgit(postage)}</span>
          </div>
        )}
        <div className="mt-2 flex items-center justify-between border-t border-amber/30 pt-2">
          <span className="font-sans text-sm font-semibold text-paper">{t("Jumlah", "Total")}</span>
          <span className="display text-2xl text-amber">{ringgit(grand)}</span>
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
