import { NextResponse } from "next/server";
import { z } from "zod";
import { createPublicSupabase } from "@/lib/supabase/public";
import {
  unitPrice,
  variantBasePrice,
  bestDiscount,
  computePostage,
  type PriceProduct,
  type SurchargeProduct,
  type VariantLite,
  type DiscountRule,
} from "@/lib/shop";

// Tempahan pasukan (jersi/hustle) — kira semula harga di SERVER dari rujukan
// item (variant_id/edition_id), jangan percaya nombor dari klien. Bukti bayaran
// dimuat naik di klien dahulu; di sini kita sahkan + simpan nilai yang sah.

const itemSchema = z.object({
  category: z.enum(["jersi", "hustle_gear", "jersi_lama", "hustle_lama"]),
  variant_id: z.string().uuid().nullable().optional(),
  edition_id: z.string().nullable().optional(),
  size: z.string().min(1).max(8),
  qty: z.number().int().min(1).max(100),
  material: z.string().nullable().optional(),
  print_name: z.string().nullable().optional(),
  print_number: z.string().nullable().optional(),
});

const schema = z.object({
  full_name: z.string().trim().min(3),
  phone: z.string().trim().min(9),
  email: z.string().trim().email().optional().or(z.literal("")).nullable(),
  delivery: z.enum(["pickup", "pos"]).default("pickup"),
  address: z.string().nullable().optional(),
  proof_url: z.string().url(),
  items: z.array(itemSchema).min(1).max(100),
});

type Row = Record<string, unknown>;
const num = (v: unknown) => Number(v) || 0;
const yearLabel = (ed: Row) => `${String(ed.name ?? "")}${ed.year ? ` ${ed.year}` : ""}`;
const vLabel = (v: Row) =>
  [v.reka_bentuk, v.penutup, v.lengan].filter(Boolean).join(" · ") || String(v.label ?? "");

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Permintaan tidak sah." }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Data tempahan tidak sah." }, { status: 422 });
  }
  const d = parsed.data;

  const supabase = createPublicSupabase();
  const [pRes, vRes, eRes, dRes, sRes] = await Promise.all([
    supabase.from("shop_products").select("*"),
    supabase.from("shop_variants").select("*"),
    supabase.from("jersey_editions").select("*"),
    supabase.from("shop_discounts").select("*").eq("active", true),
    supabase.from("shop_settings").select("*").eq("id", 1).maybeSingle(),
  ]);

  const products = (pRes.data ?? []) as Row[];
  const variants = new Map((vRes.data ?? []).map((v) => [(v as Row).id as string, v as Row]));
  const editions = new Map((eRes.data ?? []).map((e) => [(e as Row).id as string, e as Row]));
  const discounts = (dRes.data ?? []) as DiscountRule[];
  const settings = (sRes.data ?? {}) as Row;
  const jersi = products.find((p) => p.id === "jersi");
  const hustle = products.find((p) => p.id === "hustle_gear");

  const bad = (msg: string) => NextResponse.json({ ok: false, error: msg }, { status: 422 });

  type StoredItem = {
    category: string;
    label: string;
    reka_bentuk: string | null;
    penutup: string | null;
    lengan: string | null;
    material: string | null;
    edition_id?: string;
    size: string;
    qty: number;
    print_name: string | null;
    print_number: string | null;
    unit: number;
  };
  const items: StoredItem[] = [];

  for (const it of d.items) {
    const nameOn = !!it.print_name?.trim();
    const numberOn = !!it.print_number?.trim();
    const wantLycra = it.material === "Lycra";
    let unit = 0;
    let label = "";
    let reka: string | null = null;
    let penutup: string | null = null;
    let lengan: string | null = null;
    let material: string | null = null;
    let edition_id: string | undefined;

    if (it.category === "jersi") {
      if (!jersi) return bad("Produk jersi tiada.");
      const v = it.variant_id ? variants.get(it.variant_id) : undefined;
      if (!v) return bad("Variasi jersi tidak sah.");
      const lycraOn = !!v.lycra_available;
      const base = variantBasePrice(v as unknown as VariantLite, jersi as unknown as SurchargeProduct, {
        materialLycra: wantLycra,
      });
      unit = unitPrice(base, it.size, jersi as unknown as PriceProduct, nameOn, numberOn);
      reka = (v.reka_bentuk as string) ?? null;
      penutup = (v.penutup as string) ?? null;
      lengan = (v.lengan as string) ?? null;
      material = lycraOn ? (wantLycra ? "Lycra" : "Biasa") : null;
      label = lycraOn ? `${vLabel(v)} · ${material}` : vLabel(v);
    } else if (it.category === "jersi_lama") {
      const ed = it.edition_id ? editions.get(it.edition_id) : undefined;
      if (!ed) return bad("Edisi jersi lama tidak sah.");
      edition_id = ed.id as string;
      const edBase = num(ed.price);
      const v = it.variant_id ? variants.get(it.variant_id) : undefined;
      if (v && jersi) {
        const lycraOn = !!v.lycra_available;
        const base = variantBasePrice(v as unknown as VariantLite, jersi as unknown as SurchargeProduct, {
          baseOverride: edBase,
          materialLycra: wantLycra,
        });
        unit = unitPrice(base, it.size, jersi as unknown as PriceProduct, nameOn, numberOn);
        reka = (v.reka_bentuk as string) ?? null;
        penutup = (v.penutup as string) ?? null;
        lengan = (v.lengan as string) ?? null;
        material = lycraOn ? (wantLycra ? "Lycra" : "Biasa") : null;
        label = `${yearLabel(ed)} · ${vLabel(v)}${lycraOn ? ` · ${material}` : ""}`;
      } else {
        unit = unitPrice(edBase, it.size, (jersi ?? {}) as PriceProduct, nameOn, numberOn);
        label = yearLabel(ed);
      }
    } else if (it.category === "hustle_gear") {
      if (!hustle) return bad("Produk Hustle Gear tiada.");
      unit = unitPrice(num(hustle.base_price), it.size, hustle as unknown as PriceProduct, nameOn, false);
      label = "Hustle Gear";
    } else {
      // hustle_lama
      const ed = it.edition_id ? editions.get(it.edition_id) : undefined;
      if (!ed) return bad("Edisi Hustle Gear lama tidak sah.");
      edition_id = ed.id as string;
      unit = unitPrice(num(ed.price), it.size, (hustle ?? {}) as PriceProduct, nameOn, numberOn);
      label = yearLabel(ed);
    }

    items.push({
      category: it.category,
      label,
      reka_bentuk: reka,
      penutup,
      lengan,
      material,
      edition_id,
      size: it.size,
      qty: it.qty,
      print_name: nameOn ? it.print_name!.trim() : null,
      print_number: numberOn ? it.print_number!.trim() : null,
      unit,
    });
  }

  const subtotal = items.reduce((s, i) => s + i.unit * i.qty, 0);
  const totalQty = items.reduce((s, i) => s + i.qty, 0);
  const catCounts = items.reduce<Record<string, number>>((m, i) => {
    m[i.category] = (m[i.category] ?? 0) + i.qty;
    return m;
  }, {});
  const discount = bestDiscount(catCounts, subtotal, discounts)?.amount ?? 0;
  const total = subtotal - discount;
  const posOn = !!settings.pos_enabled;
  const postage = posOn && d.delivery === "pos" ? computePostage(totalQty, settings) : 0;

  const categories = new Set(items.map((i) => i.category));
  const { error } = await supabase.from("shop_orders").insert({
    category: categories.size === 1 ? [...categories][0] : "pakej",
    full_name: d.full_name.toUpperCase(),
    phone: d.phone,
    email: d.email || null,
    items,
    subtotal,
    discount,
    total,
    delivery: posOn ? d.delivery : "pickup",
    postage,
    address: posOn && d.delivery === "pos" ? d.address?.trim() || null : null,
    proof_url: d.proof_url,
  });
  if (error) {
    console.error("[order/team] insert gagal:", error.message);
    return NextResponse.json({ ok: false, error: "Gagal menyimpan tempahan." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
