import type { MetadataRoute } from "next";
import { canonical } from "@/lib/seo";

// ============================================================================
// robots.txt — dijana, supaya ia tidak boleh terpisah daripada sitemap.
//
// Versi statik dahulu menyekat enam laluan portal satu per satu. Setiap
// halaman portal BAHARU terdedah secara senyap sehingga seseorang teringat
// untuk menambahnya di sini — masalah yang sama yang sudah diperbaiki di
// proxy.ts dengan bertukar kepada default-deny. Di sini pun sama: seluruh
// /portal/ disekat sekali, jadi tiada halaman ahli boleh terlepas ke dalam
// hasil carian.
//
// Perangkak AI (ChatGPT, Perplexity, Claude, Gemini) dibenarkan secara jelas.
// Nota jujur: `User-agent: *` sudah membenarkan mereka — senarai ini tidak
// membuka apa-apa yang belum terbuka. Nilainya ialah ia menyatakan niat itu
// secara bertulis, supaya sekatan AI menyeluruh tidak ditambah tanpa sedar
// di kemudian hari. Bagi orang yang bertanya "pasukan hoki sekolah di Seri
// Kembangan" kepada pembantu AI, laman inilah yang boleh dipetik.
// ============================================================================

const PERANGKAK_AI = [
  "OAI-SearchBot", // indeks carian ChatGPT — inilah yang memetik sumber
  "ChatGPT-User",
  "GPTBot",
  "PerplexityBot",
  "Perplexity-User",
  "ClaudeBot",
  "Claude-User",
  "Google-Extended", // grounding Gemini & AI Overviews
  "Applebot-Extended",
  "Amazonbot",
  "meta-externalagent",
];

// Kawasan yang tidak boleh diindeks: seluruh portal ahli, semua API, dan
// halaman deck pelancaran yang membawa noindex.
const TERLARANG = ["/portal/", "/api/", "/launching"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: TERLARANG },
      { userAgent: PERANGKAK_AI, allow: "/", disallow: TERLARANG },
    ],
    sitemap: canonical("/sitemap.xml"),
    host: canonical("/"),
  };
}
