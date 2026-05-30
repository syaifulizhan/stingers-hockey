import { z } from "zod";
import { genderOptions, experienceOptions, positionOptions } from "@/lib/schema";

export { genderOptions, experienceOptions, positionOptions };

const optionalText = z.string().trim().optional().or(z.literal(""));
const optionalEnum = <T extends readonly [string, ...string[]]>(opts: T) =>
  z.enum(opts).optional().or(z.literal(""));

// Profil ahli — gabungan "maklumat ringkas" (Langkah 1) + "maklumat penuh"
// (Langkah 2). Medan sepadan dengan borang "Sertai Skuad" supaya boleh
// dicerminkan ke Google Sheet "Pendaftaran".
export const profileSchema = z.object({
  // Langkah 1 — ringkas
  fullName: z.string().trim().min(3, { message: "Sila masukkan nama penuh." }),
  year: z.string().trim().min(1, { message: "Sila masukkan tahun." }),
  className: z.string().trim().min(1, { message: "Sila masukkan kelas." }),

  // Langkah 2 — penuh
  dateOfBirth: z.string().min(1, { message: "Sila pilih tarikh lahir." }),
  gender: z.enum(genderOptions, { message: "Sila pilih jantina." }),
  icNumber: z
    .string()
    .trim()
    .min(6, { message: "Sila masukkan nombor kad pengenalan yang sah." }),
  school: z.string().trim().min(2, { message: "Sila masukkan sekolah." }),
  schoolRegNo: optionalText,
  playerPhone: optionalText,
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
  experience: optionalEnum(experienceOptions),
  position: optionalEnum(positionOptions),
  notes: z.string().trim().max(500, { message: "Catatan terlalu panjang." }).optional().or(z.literal("")),
});

export type ProfileInput = z.infer<typeof profileSchema>;

// Medan dikira untuk peratus "% lengkap" (progress bar).
export const profileFields = [
  "fullName",
  "year",
  "className",
  "dateOfBirth",
  "gender",
  "icNumber",
  "school",
  "schoolRegNo",
  "playerPhone",
  "guardianPhone",
  "guardianEmail",
  "experience",
  "position",
  "notes",
] as const;

// Medan untuk setiap langkah (digunakan untuk pengesahan separa).
export const step1Fields = ["fullName", "year", "className"] as const;
export const step2Fields = [
  "dateOfBirth",
  "gender",
  "icNumber",
  "school",
  "schoolRegNo",
  "playerPhone",
  "guardianPhone",
  "guardianEmail",
  "experience",
  "position",
  "notes",
] as const;
