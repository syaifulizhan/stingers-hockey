import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import ProfilLegasiView from "@/components/legasi/ProfilLegasiView";
import TiadaRekodView from "@/components/legasi/TiadaRekodView";
import { getPublishedRecords, getRecordBySlug } from "@/lib/legasi-data";
import { ALIASES, legacyUrl } from "@/lib/legasi";

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const r = await getRecordBySlug(slug);
  if (!r) return { title: "Hall of Honour — Stingers Hockey" };

  const tajuk = [r.fullName, r.result, r.event].filter(Boolean).join(" · ");
  return {
    title: `${r.fullName} — Hall of Honour Stingers Hockey`,
    description: tajuk,
    alternates: { canonical: legacyUrl(r.slug) },
    openGraph: {
      title: tajuk,
      images: r.heroImage ? [r.heroImage] : undefined,
    },
  };
}

export default async function ProfilLegasiPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Slug lama kekal berfungsi selamanya — kad yang sudah dicetak tidak mati.
  const kanonik = ALIASES[slug];
  if (kanonik && kanonik !== slug) redirect(`/legasi/${kanonik}`);

  const record = await getRecordBySlug(slug);

  // TIADA notFound() di sini, dan itu disengajakan. Lihat TiadaRekodView.
  if (!record) {
    const lain = await getPublishedRecords();
    return (
      <>
        <Navigation />
        <main className="flex-1">
          <TiadaRekodView slug={slug} records={lain} />
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navigation />
      <main className="flex-1">
        <ProfilLegasiView r={record} />
      </main>
      <Footer />
    </>
  );
}
