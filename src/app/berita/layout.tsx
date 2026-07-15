import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Berita Stingers Hockey — Hoki.my | Kemas Kini Hoki Terkini",
  description:
    "Kemas kini berita terkini Stingers Hockey. Laporan kejohanan hoki, pencapaian pemain, dan acara latihan di SK Taman Desaminium. Stingers Hockey - Hoki.my",
  keywords: [
    "berita hoki",
    "hoki keputusan",
    "kejohanan hoki",
    "stingers hockey berita",
    "hoki malaysia",
    "hoki.my",
  ],
  openGraph: {
    title: "Berita Stingers Hockey — Hoki.my",
    description: "Kemas kini berita dan laporan kejohanan hoki terkini.",
    url: "https://hoki.my/berita",
    type: "website",
  },
};

export default function BeritaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
