// Enjin harga & saiz untuk Tempahan Pasukan.
// Harga seunit = harga asas + caj saiz + (cetak nama? +fi).

export const KID_SIZES = ["24", "26", "28", "30", "32"];
export const ADULT_SIZES = ["2XS", "XS", "S", "M", "L", "XL", "2XL", "3XL", "5XL", "7XL"];
export const BIG_SIZES = ["5XL", "7XL"]; // saiz besar = caj tambahan

const n = (v: unknown) => Number(v) || 0;

export type SizeSettings = {
  big_size_surcharge: number | string;
  kid_discount: number | string;
};
export type PriceProduct = SizeSettings & {
  name_print_enabled?: boolean;
  name_print_fee?: number | string;
  number_print_enabled?: boolean;
  number_print_fee?: number | string;
};

// Tambahan/potongan harga ikut saiz.
export function sizeDelta(size: string, p: SizeSettings): number {
  if (KID_SIZES.includes(size)) return -n(p.kid_discount);
  if (BIG_SIZES.includes(size)) return n(p.big_size_surcharge);
  return 0;
}

// Harga seunit penuh untuk satu item (+ cetak nama dan/atau nombor).
export function unitPrice(
  base: number | string,
  size: string,
  p: PriceProduct,
  nameOn: boolean,
  numberOn = false
): number {
  const nameFee = nameOn && p.name_print_enabled ? n(p.name_print_fee) : 0;
  const numFee = numberOn && p.number_print_enabled ? n(p.number_print_fee) : 0;
  return n(base) + sizeDelta(size, p) + nameFee + numFee;
}

export const ringgit = (v: number) =>
  `RM ${v.toLocaleString("ms-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// Muslimah sememangnya lengan panjang → kira caj lengan sebagai "Panjang".
export const lenganKeyOf = (reka: string | null | undefined, lengan: string | null | undefined) =>
  reka === "Muslimah" ? "Panjang" : lengan ?? "";

export type SurchargeProduct = {
  lycra_surcharge?: number | string;
  reka_surcharges?: Record<string, number | string> | null;
  penutup_surcharges?: Record<string, number | string> | null;
  lengan_surcharges?: Record<string, number | string> | null;
};
export type VariantLite = {
  price: number | string;
  reka_bentuk: string | null;
  penutup: string | null;
  lengan: string | null;
  lycra_available?: boolean;
};

// Harga asas satu variasi jersi (sebelum caj saiz & cetak): harga variasi (atau
// baseOverride untuk jersi lama) + caj reka bentuk/penutup/lengan + Lycra (jika
// dipilih & ditawarkan). Dikongsi paparan klien & kiraan server supaya identik.
export function variantBasePrice(
  v: VariantLite,
  p: SurchargeProduct,
  opts?: { baseOverride?: number; materialLycra?: boolean }
): number {
  const base = opts?.baseOverride ?? n(v.price);
  const lycra = opts?.materialLycra && v.lycra_available ? n(p.lycra_surcharge) : 0;
  return (
    base +
    n(p.reka_surcharges?.[v.reka_bentuk ?? ""]) +
    n(p.penutup_surcharges?.[v.penutup ?? ""]) +
    n(p.lengan_surcharges?.[lenganKeyOf(v.reka_bentuk, v.lengan)]) +
    lycra
  );
}

// Postage berasaskan berat. Sampai pos_base_kg = pos_base; lebih → +per kg.
// Jadi beberapa helai yang masih dalam berat asas = sama harga dengan sehelai.
export type PostageSettings = {
  pos_enabled?: boolean;
  pos_weight_per_item_g?: number | string;
  pos_base?: number | string;
  pos_base_kg?: number | string;
  pos_add_per_kg?: number | string;
};
export function computePostage(itemCount: number, s: PostageSettings): number {
  const perItem = n(s.pos_weight_per_item_g) || 250;
  const base = n(s.pos_base);
  const baseKg = n(s.pos_base_kg) || 1;
  const addPerKg = n(s.pos_add_per_kg);
  const totalKg = (itemCount * perItem) / 1000;
  if (totalKg <= baseKg) return base;
  return base + Math.ceil(totalKg - baseKg) * addPerKg;
}

// ── Diskaun pelbagai (kombinasi kategori) ──────────────────────────────────
// Setiap peraturan tetap kuantiti minimum PER kategori (cth { jersi:2 } atau
// { jersi:1, hustle_gear:1 }) dan peratus atas subtotal. Bila beberapa layak,
// ambil yang beri potongan terbesar.
export const DISCOUNT_CATEGORIES = [
  { id: "jersi", label: "Jersi" },
  { id: "hustle_gear", label: "Hustle Gear" },
  { id: "jersi_lama", label: "Jersi Lama" },
  { id: "hustle_lama", label: "Hustle Gear Lama" },
] as const;

export type DiscountRule = {
  id: string;
  label: string;
  requirements: Record<string, number | string> | null;
  percent: number | string;
  active?: boolean;
};

// Peraturan sah untuk dipaparkan/digunakan (aktif, ada %, ada syarat).
export function validDiscountRules(rules: DiscountRule[]): DiscountRule[] {
  return rules.filter(
    (r) =>
      r.active !== false &&
      n(r.percent) > 0 &&
      r.requirements != null &&
      Object.values(r.requirements).some((q) => n(q) > 0)
  );
}

// Adakah troli (kiraan kuantiti ikut kategori) memenuhi syarat peraturan?
export function ruleQualifies(counts: Record<string, number>, rule: DiscountRule): boolean {
  const reqs = rule.requirements ?? {};
  const keys = Object.keys(reqs).filter((k) => n(reqs[k]) > 0);
  if (keys.length === 0) return false;
  return keys.every((cat) => (counts[cat] ?? 0) >= n(reqs[cat]));
}

// Diskaun terbaik untuk troli: pulang peraturan + jumlah potongan (RM).
export function bestDiscount(
  counts: Record<string, number>,
  subtotal: number,
  rules: DiscountRule[]
): { rule: DiscountRule; amount: number } | null {
  let best: { rule: DiscountRule; amount: number } | null = null;
  for (const r of validDiscountRules(rules)) {
    if (!ruleQualifies(counts, r)) continue;
    const amount = (subtotal * n(r.percent)) / 100;
    if (amount > 0 && (!best || amount > best.amount)) best = { rule: r, amount };
  }
  return best;
}

// Huraian syarat untuk paparan, cth "2 × Jersi" atau "Jersi + Hustle Gear".
export function describeRequirements(reqs: Record<string, number | string> | null): string {
  const labels = Object.fromEntries(DISCOUNT_CATEGORIES.map((c) => [c.id, c.label]));
  return Object.entries(reqs ?? {})
    .filter(([, q]) => n(q) > 0)
    .map(([c, q]) => (n(q) > 1 ? `${n(q)} × ` : "") + (labels[c] ?? c))
    .join(" + ");
}
