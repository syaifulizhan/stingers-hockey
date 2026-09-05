import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import ProfilLegasiView from "@/components/legasi/ProfilLegasiView";
import TiadaRekodView from "@/components/legasi/TiadaRekodView";
import JsonLd from "@/components/JsonLd";
import { getPublishedRecords, getRecordBySlug } from "@/lib/legasi-data";
import { ALIASES, legacyUrl } from "@/lib/legasi";
import { ringkasan, SITE_NAME, SITE_URL, tajukHalaman } from "@/lib/seo";
import { breadcrumbs, graf } from "@/lib/jsonld";

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const r = await getRecordBySlug(slug);
  // Slug yang tidak dikenali TIDAK memulangkan 404 — itu disengajakan, supaya
  // kad yang sudah dicetak tidak pernah membawa ke jalan mati (lihat
  // TiadaRekodView). Tetapi ia bermakna setiap rentetan yang mungkin
  // memulangkan halaman 200, dan itu ruang URL tak terhingga yang penuh
  // kandungan nipis. Manusia masih melihat halaman itu; enjin carian
  // disuruh jangan indeks, tetapi ikut pautan keluar darinya.
  if (!r) {
    return {
      title: `Hall of Honour — ${SITE_NAME}`,
      robots: { index: false, follow: true },
    };
  }

  const tajuk = [r.fullName, r.result, r.event].filter(Boolean).join(" · ");
  // Kisah pemain ialah teks unik; ia jauh lebih baik sebagai cuplikan carian
  // daripada senarai medan yang dipisah titik.
  const perihal =
    ringkasan(r.story) ??
    `${tajuk}. Rekod kekal Hall of Honour ${SITE_NAME}, SK Taman Desaminium.`;
  // Tiada `images` — lihat nota yang sama di berita/[id]/page.tsx. Kad yang
  // dijana meletakkan nama pemain dan nombor rekod di atas foto mereka.
  return {
    title: tajukHalaman(`${r.fullName} — Hall of Honour`),
    description: perihal,
    alternates: { canonical: legacyUrl(r.slug) },
    openGraph: {
      type: "profile",
      // Lihat nota di berita/[id]: blok openGraph tidak diwarisi medan demi
      // medan, jadi medan peringkat laman perlu dinyatakan semula.
      siteName: SITE_NAME,
      locale: "ms_MY",
      title: tajuk,
      description: perihal,
      url: legacyUrl(r.slug),
    },
    twitter: {
      card: "summary_large_image",
      title: tajuk,
      description: perihal,
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

  // Person ialah jenis yang betul untuk halaman ini: ia mengenai seorang
  // pemain, bukan artikel tentangnya. Ini yang memberi peluang kepada carian
  // atas nama penuh pemain — kata kunci sebenar yang membawa keluarga ke sini
  // apabila mereka mengimbas QR pada kad yang dicetak.
  const orangSchema = {
    "@type": "Person",
    "@id": legacyUrl(record.slug),
    mainEntityOfPage: legacyUrl(record.slug),
    name: record.fullName,
    ...(record.heroImage ? { image: record.heroImage } : {}),
    ...(record.story ? { description: ringkasan(record.story, 300) } : {}),
    memberOf: { "@id": `${SITE_URL}/#pasukan` },
    ...(record.school ? { alumniOf: { "@type": "EducationalOrganization", name: record.school } } : {}),
    ...(record.result || record.event
      ? { award: [record.result, record.event].filter(Boolean).join(" — ") }
      : {}),
  };

  return (
    <>
      <JsonLd
        json={graf(
          orangSchema,
          breadcrumbs([
            { nama: "Hall of Honour", laluan: "/legasi" },
            { nama: record.fullName },
          ])
        )}
      />
      <Navigation />
      <main className="flex-1">
        <ProfilLegasiView r={record} />
      </main>
      <Footer />
    </>
  );
}
