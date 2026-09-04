import type { Metadata } from "next";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import HallOfHonourView from "@/components/legasi/HallOfHonourView";
import { getPublishedRecords } from "@/lib/legasi-data";

export const metadata: Metadata = {
  title: "Hall of Honour — Stingers Hockey",
  description:
    "Rekod kekal pemain Stingers Hockey yang mewakili sekolah di peringkat lebih tinggi. Mereka yang membawa nama Stingers keluar dari padang ini, akan kekal namanya di sini.",
  alternates: { canonical: "https://hoki.my/legasi" },
};

// Rekod jarang berubah; bina semula setiap jam sudah memadai, dan halaman
// kekal tersaji walaupun DB tidak menjawab pada saat itu.
export const revalidate = 3600;

export default async function HallOfHonourPage() {
  const records = await getPublishedRecords();

  return (
    <>
      <Navigation />
      <main className="flex-1">
        <HallOfHonourView records={records} />
      </main>
      <Footer />
    </>
  );
}
