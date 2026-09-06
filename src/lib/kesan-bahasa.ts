import type { Lang } from "@/lib/i18n";

// ============================================================================
// BAHASA PERTAMA — teka sekali, hormat pilihan selamanya.
//
// Pelawat dari Malaysia, Singapura, Indonesia dan Brunei mendapat Bahasa
// Melayu. Semua orang lain mendapat Bahasa Inggeris tanpa perlu mencari pil
// bahasa dahulu. Seorang jurulatih di Belanda yang membuka pautan Hall of
// Honour tidak sepatutnya melihat dinding perkataan Melayu sebelum menyedari
// ada suis di suatu tempat.
//
// KENAPA ZON WAKTU DAN BUKAN IP. Mencari lokasi melalui IP bermakna sama ada
// perkhidmatan luar (kos, kelewatan, satu lagi benda yang boleh tumbang) atau
// membaca pengepala geo Vercel dalam layout — dan membaca pengepala dalam
// layout akar menjadikan SETIAP halaman dirender secara dinamik, membunuh
// caching statik seluruh laman.
//
// Zon waktu pelayar percuma, serta-merta, tidak memerlukan permintaan, dan
// tepat untuk soalan sebenar di sini: "adakah orang ini berada di rantau
// yang bertutur Melayu?" Ia dibaca dari jam peranti, bukan dijejak.
//
// PILIHAN MANUSIA SENTIASA MENANG. Tekaan ini hanya berlaku apabila tiada
// apa yang tersimpan. Sebaik seseorang menyentuh pil itu, pilihannya
// disimpan dan tekaan ini tidak pernah berjalan lagi untuk mereka.
// ============================================================================

/** Zon waktu di rantau yang bertutur Melayu. */
const ZON_MELAYU = new Set([
  "Asia/Kuala_Lumpur",
  "Asia/Kuching",
  "Asia/Singapore",
  "Asia/Brunei",
  "Asia/Jakarta",
  "Asia/Pontianak",
  "Asia/Makassar",
  "Asia/Jayapura",
]);

/** Kod bahasa yang bermaksud orang ini memang membaca Melayu/Indonesia. */
const KOD_MELAYU = /^(ms|id|zsm|in)\b/i;

/**
 * Bahasa untuk pelawat yang belum pernah memilih.
 *
 * Tidak pernah melontar: setiap bacaan dibungkus kerana pelayar yang dikunci
 * ketat boleh menyekat Intl atau navigator, dan kegagalan mengesan tidak
 * sepatutnya menghalang laman daripada dirender.
 */
export function kesanBahasa(): Lang {
  try {
    // Bahasa yang ditetapkan pengguna pada perantinya ialah isyarat paling
    // kuat, dan ia mengatasi zon waktu: seseorang di London yang menetapkan
    // perantinya kepada Bahasa Melayu memang mahu Bahasa Melayu.
    const kod = [
      ...(navigator.languages ?? []),
      navigator.language,
    ].filter(Boolean) as string[];
    if (kod.some((k) => KOD_MELAYU.test(k))) return "ms";

    const zon = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (zon && ZON_MELAYU.has(zon)) return "ms";

    // Zon dikenali dan berada di luar rantau → Inggeris.
    if (zon) return "en";
  } catch {
    // Tiada apa yang boleh dibaca; jatuh balik ke bahasa laman.
  }
  return "ms";
}
