import { z } from "zod";

// Skema borang Pendaftaran Pencarian Bakat 2026.
// Semua mesej ralat dalam Bahasa Melayu.

export const genderOptions = ["Lelaki", "Perempuan"] as const;

export const experienceOptions = [
  "Tiada",
  "Sekolah Lama",
  "Klinik",
  "Akademi",
] as const;

export const positionOptions = [
  "Penyerang",
  "Tengah",
  "Pertahanan",
  "Penjaga Gol",
  "Tidak Pasti",
] as const;

export const registerSchema = z.object({
  // Maklumat Pemain
  fullName: z
    .string()
    .trim()
    .min(3, { message: "Sila masukkan nama penuh." })
    .transform((v) => v.toUpperCase()),
  dateOfBirth: z
    .string()
    .min(1, { message: "Sila pilih tarikh lahir." }),
  gender: z.enum(genderOptions, {
    message: "Sila pilih jantina.",
  }),
  icNumber: z
    .string()
    .trim()
    .min(6, { message: "Sila masukkan nombor kad pengenalan yang sah." }),

  // Maklumat Sekolah
  school: z.string().trim().min(2, { message: "Sila masukkan sekolah sekarang." }),
  form: z.string().trim().min(1, { message: "Sila masukkan tingkatan/tahun." }),
  className: z.string().trim().min(1, { message: "Sila masukkan kelas." }),

  // Maklumat Hubungan
  playerPhone: z
    .string()
    .trim()
    .min(9, { message: "Sila masukkan nombor telefon pemain yang sah." }),
  guardianPhone: z
    .string()
    .trim()
    .min(9, { message: "Sila masukkan nombor telefon penjaga yang sah." }),
  guardianEmail: z
    .string()
    .trim()
    .email({ message: "Format email tidak sah." })
    .optional()
    .or(z.literal("")),

  // Maklumat Tambahan
  experience: z.enum(experienceOptions).optional(),
  position: z.enum(positionOptions).optional(),
  notes: z.string().trim().max(500, { message: "Catatan terlalu panjang." }).optional(),

  // Pengesahan
  consent: z.literal(true, {
    message: "Anda perlu mengesahkan maklumat ini sebelum mendaftar.",
  }),
});

export type RegisterInput = z.infer<typeof registerSchema>;
