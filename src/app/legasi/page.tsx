import type { Metadata } from "next";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import DewanLegasiView from "@/components/legasi/DewanLegasiView";
import { getPublishedRecords } from "@/lib/legasi-data";

export const metadata: Metadata = {
  title: "Dewan Legasi — Stingers Hockey",
  description:
    "Rekod kekal pemain Stingers Hockey yang mewakili sekolah di peringkat lebih tinggi. Setiap rekod kekal selamanya.",
  alternates: { canonical: "https://hoki.my/legasi" },
};

// Rekod jarang berubah; bina semula setiap jam sudah memadai, dan halaman
// kekal tersaji walaupun DB tidak menjawab pada saat itu.
export const revalidate = 3600;

export default async function DewanLegasiPage() {
  const records = await getPublishedRecords();

  return (
    <>
      <Navigation />
      <main className="flex-1">
        <DewanLegasiView records={records} />
      </main>
      <Footer />
    </>
  );
}
