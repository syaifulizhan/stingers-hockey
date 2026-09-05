import type { Metadata } from "next";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import HallOfHonourView from "@/components/legasi/HallOfHonourView";
import JsonLd from "@/components/JsonLd";
import { getPublishedRecords } from "@/lib/legasi-data";
import { canonical, ogHalaman, SITE_NAME } from "@/lib/seo";
import { breadcrumbs, graf } from "@/lib/jsonld";

export const metadata: Metadata = {
  title: "Hall of Honour — Stingers Hockey",
  // 148 aksara. Versi sebelum ini 169 dan hujungnya dipotong Google.
  description:
    "Rekod kekal pemain Stingers Hockey yang mewakili SK Taman Desaminium di peringkat lebih tinggi. Mereka yang membawa nama Stingers keluar dari padang ini.",
  alternates: { canonical: canonical("/legasi") },
  openGraph: ogHalaman({
    title: `Hall of Honour — ${SITE_NAME}`,
    description:
      "Rekod kekal pemain Stingers Hockey yang mewakili sekolah di peringkat lebih tinggi.",
    path: "/legasi",
  }),
};

// Rekod jarang berubah; bina semula setiap jam sudah memadai, dan halaman
// kekal tersaji walaupun DB tidak menjawab pada saat itu.
export const revalidate = 3600;

export default async function HallOfHonourPage() {
  const records = await getPublishedRecords();

  // Setiap rekod ialah halaman berasingan yang membawa nama penuh seorang
  // pemain. ItemList menyatakan hubungan itu supaya nama-nama tersebut boleh
  // ditemui walaupun sebelum setiap profil dirangkak.
  const senaraiSchema = {
    "@type": "ItemList",
    name: `Hall of Honour — ${SITE_NAME}`,
    numberOfItems: records.length,
    itemListElement: records.map((r, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: canonical(`/legasi/${r.slug}`),
      name: r.fullName,
    })),
  };

  return (
    <>
      <JsonLd json={graf(senaraiSchema, breadcrumbs([{ nama: "Hall of Honour" }]))} />
      <Navigation />
      <main className="flex-1">
        <HallOfHonourView records={records} />
      </main>
      <Footer />
    </>
  );
}
