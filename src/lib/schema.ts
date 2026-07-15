import { z } from "zod";

// Skema borang Pendaftaran Pencarian Bakat 2026.
// Semua mesej ralat dalam Bahasa Melayu.

export const genderOptions = ["Lelaki", "Perempuan"] as const;

export const experienceOptions = [
  "Tiada",
  "Sekolah Lama",
  "Kelab",
  "Akademi",
] as const;

export const positionOptions = [
  "Penyerang",
  "Tengah",
  "Pertahanan",
  "Penjaga Gol",
  "Tidak Pasti",
] as const;

const optionalText = z.string().trim().optional().or(z.literal(""));

export const registerSchema = z.object({
  // Maklumat Pemain
  fullName: z
    .string()
    .trim()
    .min(3, { message: "Sila masukkan nama penuh." })
    .transform((v) => v.toUpperCase()),
  dateOfBirth: z.string().min(1, { message: "Sila pilih tarikh lahir." }),
  gender: z.enum(genderOptions, {
    message: "Sila pilih jantina.",
  }),
  icNumber: z
    .string()
    .trim()
    .min(6, { message: "Sila masukkan nombor kad pengenalan yang sah." }),

  // Maklumat Sekolah
  school: z.string().trim().min(2, { message: "Sila masukkan sekolah sekarang." }),
  schoolRegNo: optionalText, // No. Pendaftaran Sekolah (optional)
  year: z.string().trim().min(1, { message: "Sila masukkan tahun." }),
  className: z.string().trim().min(1, { message: "Sila masukkan kelas." }),

  // Maklumat Hubungan
  playerPhone: optionalText, // optional
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
  notes: z
    .string()
    .trim()
    .max(500, { message: "Catatan terlalu panjang." })
    .optional(),

  // Pengesahan
  consent: z.literal(true, {
    message: "Anda perlu mengesahkan maklumat ini sebelum mendaftar.",
  }),
});

export type RegisterInput = z.infer<typeof registerSchema>;

// ==================== SEO Schemas ====================

export const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Apa itu Stingers Hockey?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Stingers Hockey adalah pasukan hoki rasmi SK Taman Desaminium sejak 2017. Kami melatih pemain dengan disiplin, semangat, dan kemahiran tinggi.",
      },
    },
    {
      "@type": "Question",
      name: "Bagaimana cara sertai Stingers Hockey?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Anda boleh sertai pencarian bakat Stingers Hockey 2026. Latihan diadakan setiap Selasa & Rabu (Lelaki) dan Khamis & Jumaat (Perempuan) pada pukul 7:30 pagi hingga 9:30 pagi.",
      },
    },
    {
      "@type": "Question",
      name: "Bagaimana cara menghubungi Stingers Hockey?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Hubungi kami di +03-8941 3905 atau hstingers@gmail.com. Lokasi: SK Taman Desaminium, Seri Kembangan, Selangor.",
      },
    },
  ],
};

export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: "Stingers Hockey",
  url: "https://hoki.my",
  telephone: "+60389413905",
  email: "hstingers@gmail.com",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Persiaran Desaminium 1, Taman Desaminium",
    addressLocality: "Seri Kembangan",
    postalCode: "43300",
    addressCountry: "MY",
  },
  areaServed: ["Selangor", "Malaysia"],
};
