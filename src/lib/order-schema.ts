import { z } from "zod";

// Skema borang Tempahan Hustle Gear (training kit) 2026.
// Semua mesej ralat dalam Bahasa Melayu.

// Harga seunit (RM). Digunakan oleh borang & API untuk kira jumlah.
export const UNIT_PRICE = 20;

// Saiz mengikut carta rasmi Hustle Gear 2026.
export const childSizes = ["24", "26", "28", "30", "32"] as const;
export const adultSizes = [
  "2XS",
  "XS",
  "S",
  "M",
  "L",
  "XL",
  "2XL",
  "3XL",
  "5XL",
  "7XL",
] as const;

export const sizeOptions = [...childSizes, ...adultSizes] as const;

export const orderSchema = z.object({
  // Maklumat Penempah
  fullName: z
    .string()
    .trim()
    .min(3, { message: "Sila masukkan nama penuh." })
    .transform((v) => v.toUpperCase()),
  phone: z
    .string()
    .trim()
    .min(9, { message: "Sila masukkan nombor telefon yang sah." }),
  email: z
    .string()
    .trim()
    .email({ message: "Format email tidak sah." })
    .optional()
    .or(z.literal("")),

  // Tempahan
  size: z.enum(sizeOptions, { message: "Sila pilih saiz baju." }),
  quantity: z
    .number({ message: "Sila masukkan kuantiti." })
    .int({ message: "Kuantiti mesti nombor bulat." })
    .min(1, { message: "Kuantiti minimum ialah 1." })
    .max(50, { message: "Kuantiti maksimum ialah 50. Hubungi kami untuk tempahan besar." }),

  // Maklumat tambahan
  notes: z
    .string()
    .trim()
    .max(500, { message: "Catatan terlalu panjang." })
    .optional(),

  // Pengesahan
  consent: z.literal(true, {
    message: "Anda perlu mengesahkan tempahan ini sebelum menghantar.",
  }),
});

export type OrderInput = z.infer<typeof orderSchema>;
