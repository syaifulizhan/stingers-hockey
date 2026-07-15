// Dynamic SEO metadata per page
export const pageMetadata: Record<string, { title: string; description: string; keywords: string[] }> = {
  home: {
    title: "Stingers Hockey — Hoki.my | Pasukan Hoki Rasmi SK Taman Desaminium",
    description: "Hoki.my - Pasukan hoki rasmi SK Taman Desaminium. Cari bakat hoki 2026. Latihan, kejohanan, jersi hoki berkualitas. Strike Hard, Strike Fast.",
    keywords: ["hoki", "hoki malaysia", "hoki.my", "stingers hockey", "pasukan hoki", "hoki sekolah", "hoki seri kembangan"],
  },
  berita: {
    title: "Berita Stingers Hockey — Hoki.my | Kemas Kini Hoki Terkini",
    description: "Kemas kini berita terkini Stingers Hockey. Laporan kejohanan, pencapaian pemain, dan acara latihan hoki di SK Taman Desaminium.",
    keywords: ["berita hoki", "hoki keputusan", "kejohanan hoki", "stingers hockey berita", "hoki malaysia", "hoki.my"],
  },
  live: {
    title: "Live Stingers Hockey — Hoki.my | Keputusan & Jadual Perlawanan",
    description: "Keputusan live dan jadual perlawanan Stingers Hockey. Ikuti pertandingan hoki sekolah terkini di SK Taman Desaminium.",
    keywords: ["keputusan hoki", "jadual hoki", "perlawanan hoki", "live hoki", "stingers hockey keputusan", "hoki.my"],
  },
  latihan: {
    title: "Jadual Latihan Stingers Hockey — Hoki.my | Seni Bermain Hoki",
    description: "Jadual latihan Stingers Hockey. Bergabunglah dengan pencarian bakat hoki 2026. Latihan berkualitas di SK Taman Desaminium, Seri Kembangan.",
    keywords: ["jadual latihan hoki", "latihan hoki", "pencarian bakat hoki", "hoki sekolah", "stingers hockey latihan", "hoki.my"],
  },
  tempahan: {
    title: "Tempahan Jersi & Hustle Gear — Hoki.my | Perlengkapan Hoki Berkualitas",
    description: "Tempahan jersi hoki dan hustle gear Stingers Hockey. Perlengkapan hoki resmi berkualitas tinggi. Pesan sekarang untuk musim 2026.",
    keywords: ["jersi hoki", "tempahan hoki", "hustle gear", "perlengkapan hoki", "hoki.my", "stingers hockey jersi"],
  },
};

export function getPageSEO(page: string) {
  return pageMetadata[page] || pageMetadata.home;
}

// Internal linking suggestions untuk SEO
export const internalLinks = {
  home: [
    { href: "/berita", text: "Kemas Kini Berita Hoki Terkini" },
    { href: "/live", text: "Keputusan Live Perlawanan Hoki" },
  ],
  berita: [
    { href: "/", text: "Kembali ke Stingers Hockey" },
    { href: "/live", text: "Lihat Keputusan Perlawanan" },
  ],
  live: [
    { href: "/berita", text: "Baca Laporan Berita Hoki" },
    { href: "/", text: "Kembali ke Halaman Utama Hoki.my" },
  ],
};
