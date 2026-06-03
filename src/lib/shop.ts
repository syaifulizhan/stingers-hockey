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
