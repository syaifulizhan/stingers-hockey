import { SITE_URL, SITE_NAME, canonical } from "@/lib/seo";
import { contact, socialSebenar } from "@/lib/site";

// ============================================================================
// Structured data (JSON-LD) — memberitahu enjin carian APA benda ini, bukan
// hanya perkataan apa yang ada padanya.
//
// Dipisahkan daripada lib/schema.ts, yang sepatutnya menyimpan skema borang
// Zod sahaja. Dua jenis "schema" yang tidak berkaitan dalam satu fail ialah
// sebabnya seseorang pernah terpaksa membuat commit bertajuk "Merge SEO
// schemas with existing form validation schemas".
//
// DUA PENGISYTIHARAN PALSU DIBUANG DARI VERSI LAMA:
//
//   1. SearchAction yang menunjuk ke /search?q= dan /berita?search=. Laman ini
//      tidak mempunyai carian langsung — /search bukan laluan, dan
//      BeritaArchiveView tidak pernah membaca parameter `search`. Kotak carian
//      sitelinks yang menghantar orang ke 404 boleh menyebabkan structured
//      data ditandakan tidak sah.
//
//   2. BreadcrumbList yang tetap: Hoki.my → Berita → Live, dihidangkan pada
//      SETIAP halaman termasuk /tempahan dan /legasi. Breadcrumb sepatutnya
//      menerangkan kedudukan halaman SEMASA. Satu trail tetap yang sama di
//      mana-mana adalah salah di hampir setiap halaman yang membawanya.
//      Digantikan dengan breadcrumbs() di bawah, yang dibina per halaman.
// ============================================================================

const ID_PASUKAN = `${SITE_URL}/#pasukan`;
const ID_SEKOLAH = `${SITE_URL}/#sekolah`;
const LOGO = `${SITE_URL}/images/logo.png`;

const ALAMAT = {
  "@type": "PostalAddress",
  streetAddress: "Persiaran Desaminium 1, Taman Desaminium",
  addressLocality: "Seri Kembangan",
  postalCode: "43300",
  addressRegion: "Selangor",
  addressCountry: "MY",
} as const;

/**
 * Entiti pasukan — dirujuk melalui @id oleh setiap graf lain.
 *
 * @id ialah bahagian yang penting. Tanpanya, SportsTeam dan
 * EducationalOrganization dibaca sebagai dua entiti tidak berkaitan yang
 * kebetulan berkongsi alamat. Dengannya, mereka menjadi satu benda yang
 * difahami enjin carian.
 */
export const pasukanSchema = {
  "@type": "SportsTeam",
  "@id": ID_PASUKAN,
  name: SITE_NAME,
  alternateName: ["Stingers", "Hoki.my", "Stingers Hockey SKTD"],
  sport: "Field Hockey",
  foundingDate: "2017",
  slogan: "Strike Hard. Strike Fast.",
  url: SITE_URL,
  logo: LOGO,
  image: LOGO,
  email: contact.email,
  telephone: "+60389413905",
  memberOf: { "@id": ID_SEKOLAH },
  location: {
    "@type": "Place",
    name: "SK Taman Desaminium",
    address: ALAMAT,
  },
  areaServed: ["Seri Kembangan", "Selangor", "Malaysia"],
  // `sameAs` disertakan hanya apabila terdapat profil sebenar untuk ditunjuk.
  // Ia mengesahkan identiti entiti kepada Google — tetapi hanya jika alamatnya
  // benar. Menunjuk ke facebook.com kosong lebih memudaratkan daripada diam.
  ...(socialSebenar.length ? { sameAs: socialSebenar } : {}),
};

export const sekolahSchema = {
  "@type": "EducationalOrganization",
  "@id": ID_SEKOLAH,
  name: "Sekolah Kebangsaan Taman Desaminium",
  alternateName: "SK Taman Desaminium",
  address: ALAMAT,
  telephone: "+60389413905",
};

export const websiteSchema = {
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  name: SITE_NAME,
  alternateName: "Hoki.my",
  url: SITE_URL,
  inLanguage: "ms-MY",
  publisher: { "@id": ID_PASUKAN },
};

export const faqSchema = {
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Apa itu Stingers Hockey?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Stingers Hockey ialah pasukan hoki rasmi SK Taman Desaminium, Seri Kembangan, Selangor sejak 2017. Kami melatih pemain sekolah rendah dalam hoki padang dengan disiplin, semangat dan kemahiran.",
      },
    },
    {
      "@type": "Question",
      name: "Bagaimana cara sertai Stingers Hockey?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Anda boleh sertai pencarian bakat Stingers Hockey 2026 melalui borang pendaftaran di hoki.my. Latihan diadakan setiap Selasa & Rabu (lelaki) dan Khamis & Jumaat (perempuan), 7:30 pagi hingga 9:30 pagi di SK Taman Desaminium.",
      },
    },
    {
      "@type": "Question",
      name: "Di mana Stingers Hockey berlatih?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Di SK Taman Desaminium, Persiaran Desaminium 1, Taman Desaminium, 43300 Seri Kembangan, Selangor.",
      },
    },
    {
      "@type": "Question",
      name: "Bagaimana cara menghubungi Stingers Hockey?",
      acceptedAnswer: {
        "@type": "Answer",
        text: `Hubungi kami di ${contact.phone} atau ${contact.email}. Lokasi: SK Taman Desaminium, Seri Kembangan, Selangor.`,
      },
    },
  ],
};

/**
 * Breadcrumb bagi satu halaman tertentu.
 *
 * Hantar laluan dari akar ke halaman semasa, cth:
 *   breadcrumbs([{ nama: "Berita", laluan: "/berita" }, { nama: tajuk }])
 * Item terakhir tidak memerlukan laluan — ia halaman yang sedang dibaca.
 */
export function breadcrumbs(
  jejak: { nama: string; laluan?: string }[]
): Record<string, unknown> {
  const semua = [{ nama: "Hoki.my", laluan: "/" }, ...jejak];
  return {
    "@type": "BreadcrumbList",
    itemListElement: semua.map((s, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: s.nama,
      ...(s.laluan ? { item: canonical(s.laluan) } : {}),
    })),
  };
}

/** Bungkus mana-mana nod menjadi satu blok <script> @graph. */
export function graf(...nod: unknown[]): string {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@graph": nod.filter(Boolean),
  });
}
