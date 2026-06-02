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
};

// Tambahan/potongan harga ikut saiz.
export function sizeDelta(size: string, p: SizeSettings): number {
  if (KID_SIZES.includes(size)) return -n(p.kid_discount);
  if (BIG_SIZES.includes(size)) return n(p.big_size_surcharge);
  return 0;
}

// Harga seunit penuh untuk satu item.
export function unitPrice(
  base: number | string,
  size: string,
  p: PriceProduct,
  namePrint: boolean
): number {
  const fee = namePrint && p.name_print_enabled ? n(p.name_print_fee) : 0;
  return n(base) + sizeDelta(size, p) + fee;
}

export const ringgit = (v: number) =>
  `RM ${v.toLocaleString("ms-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
