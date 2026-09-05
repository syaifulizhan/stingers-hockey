import { getAllNews } from "@/lib/news-data";
import { canonical, ringkasan, SITE_NAME, SITE_URL } from "@/lib/seo";

// ============================================================================
// Suapan RSS — /berita/rss.xml
//
// Percuma, dan ia bekerja semasa anda tidur: agregator berita, pembaca suapan
// dan alat penjadual media sosial semuanya memakan RSS. Setiap tempat yang
// menyiarkan semula suapan ini ialah satu lagi jalan masuk ke laman ini yang
// tidak perlu dibayar atau dijaga.
//
// Ia juga tempat yang paling mudah untuk sekolah lain atau persatuan hoki
// daerah mengikuti apa yang pasukan ini lakukan — dan pautan dari laman
// merekalah yang sebenarnya menaikkan kedudukan carian.
// ============================================================================

// Dibina semula setiap jam, seperti sitemap.
export const revalidate = 3600;

/** XML tidak memaafkan & atau < yang bogel, walaupun di dalam CDATA. */
function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function GET() {
  const news = await getAllNews();
  const terkini = news.slice(0, 30);
  const dibina = terkini[0]?.publishedAt ?? new Date().toISOString();

  const items = terkini
    .map((n) => {
      const url = canonical(`/berita/${n.slug}`);
      return `    <item>
      <title>${esc(n.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${new Date(n.publishedAt).toUTCString()}</pubDate>
      <description>${esc(ringkasan(n.body, 400) ?? n.title)}</description>${
        n.imageUrl
          ? `\n      <enclosure url="${esc(n.imageUrl)}" type="image/jpeg" />`
          : ""
      }
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Berita ${esc(SITE_NAME)}</title>
    <link>${canonical("/berita")}</link>
    <description>Berita dan perkembangan terkini pasukan hoki Stingers, SK Taman Desaminium, Seri Kembangan.</description>
    <language>ms-MY</language>
    <lastBuildDate>${new Date(dibina).toUTCString()}</lastBuildDate>
    <image>
      <url>${SITE_URL}/images/logo.png</url>
      <title>${esc(SITE_NAME)}</title>
      <link>${SITE_URL}</link>
    </image>
    <atom:link href="${canonical("/berita/rss.xml")}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      // CDN menyimpan sejam, dan boleh menyajikan salinan lapuk sehari sambil
      // menyegarkan di belakang — pembaca suapan tidak pernah nampak ralat.
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
