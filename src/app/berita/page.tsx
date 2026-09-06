import type { Metadata } from "next";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import BeritaArchiveView from "@/components/BeritaArchiveView";
import JsonLd from "@/components/JsonLd";
import { getAllNews } from "@/lib/news-data";
import { canonical, ogHalaman, SITE_NAME } from "@/lib/seo";
import { breadcrumbs, graf } from "@/lib/jsonld";

export const revalidate = 60;

export const metadata: Metadata = {
  title: `Berita Hoki Terkini — ${SITE_NAME}`,
  description:
    "Berita dan perkembangan terkini pasukan hoki Stingers, SK Taman Desaminium, Seri Kembangan — laporan kejohanan, pemilihan pemain dan keputusan perlawanan.",
  alternates: {
    canonical: canonical("/berita"),
    types: { "application/rss+xml": canonical("/berita/rss.xml") },
  },
  openGraph: ogHalaman({
    title: `Berita Hoki Terkini — ${SITE_NAME}`,
    description:
      "Laporan kejohanan, pemilihan pemain dan keputusan perlawanan pasukan hoki SK Taman Desaminium.",
    path: "/berita",
  }),
};

export default async function BeritaArchivePage() {
  const news = await getAllNews();

  // ItemList memberitahu enjin carian bahawa halaman ini ialah indeks, dan
  // artikel manakah yang ada di dalamnya. Ia membantu artikel ditemui walaupun
  // sebelum perangkak sempat melawat setiap satu.
  const senaraiSchema = {
    "@type": "ItemList",
    name: `Berita ${SITE_NAME}`,
    numberOfItems: news.length,
    itemListElement: news.map((n, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: canonical(`/berita/${n.slug}`),
      name: n.title,
    })),
  };

  return (
    <>
      <JsonLd json={graf(senaraiSchema, breadcrumbs([{ nama: "Berita" }]))} />
      <Navigation />
      <main className="flex-1">
        <BeritaArchiveView
          // `translations` MESTI dibawa melalui peta ini. getAllNews sudah
          // membacanya dan BeritaArchiveView sudah tahu menggunakannya, tetapi
          // medan yang digugurkan di sini tidak pernah sampai — setiap kad
          // arkib kekal Melayu walaupun pil EN ditekan. Ini kelas pepijat yang
          // sama seperti lajur yang tidak diminta dalam Berita.tsx.
          news={news.map((n) => ({
            id: n.id,
            title: n.title,
            body: n.body,
            image_url: n.imageUrl,
            published_at: n.publishedAt,
            slug: n.slug,
            translations: n.translations,
          }))}
        />
      </main>
      <Footer />
    </>
  );
}
