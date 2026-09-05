import "server-only";
import { terjemahMedan } from "@/lib/terjemah";

// ============================================================================
// Membina blok terjemahan yang disimpan pada setiap rekod.
//
// Bentuknya { en: { medan: "teks" } } — satu lajur jsonb dan bukan sepasang
// lajur bagi setiap medan. Cerita, petikan, tajuk, kategori dan kejohanan
// semuanya perlu versi Inggerisnya, dan sepuluh lajur `*_en` akan menjadi
// dua puluh sebaik bahasa ketiga muncul.
//
// Medan yang gagal diterjemah TIDAK disimpan langsung. Ketiadaannya ialah
// isyarat kepada paparan supaya jatuh balik ke bahasa Melayu, dan itu lebih
// baik daripada menyimpan rentetan kosong yang memaparkan ruang kosong.
// ============================================================================

export type Terjemahan = { en?: Record<string, string> };

/** Nama pemain dipecah menjadi istilah terlindung supaya ejaannya tidak berubah. */
function lindungNama(...nama: (string | null | undefined)[]): string[] {
  return nama
    .filter((n): n is string => Boolean(n && n.trim()))
    .flatMap((n) => [n, ...n.split(/\s+/)])
    .filter((w) => w.length > 2);
}

export async function terjemahBerita(news: {
  title: string;
  body: string | null;
}): Promise<Terjemahan | null> {
  const en = await terjemahMedan({ title: news.title, body: news.body });
  return Object.keys(en).length > 0 ? { en } : null;
}

export async function terjemahLegasi(r: {
  fullName?: string | null;
  nameFirst?: string | null;
  nameLast?: string | null;
  story?: string | null;
  quoteText?: string | null;
  quoteBy?: string | null;
  result?: string | null;
  category?: string | null;
  event?: string | null;
}): Promise<Terjemahan | null> {
  const lindung = lindungNama(r.fullName, r.nameFirst, r.nameLast, r.quoteBy);
  const en = await terjemahMedan(
    {
      story: r.story,
      quoteText: r.quoteText,
      result: r.result,
      category: r.category,
      event: r.event,
    },
    lindung,
  );
  return Object.keys(en).length > 0 ? { en } : null;
}
