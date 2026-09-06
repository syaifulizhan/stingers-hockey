// ============================================================================
// JANTINA DARI NAMA — dan pembetulan kata ganti Inggeris.
//
// KENAPA INI WUJUD. Bahasa Melayu tiada kata ganti diri berjantina: "dia" dan
// "beliau" merujuk sesiapa. Bahasa Inggeris memaksa pilihan. Jadi setiap
// perkhidmatan terjemahan mesin MESTI meneka — dan ia meneka teruk.
//
// Diperhati pada data sebenar (rekod Adelia, 2026-09-07): satu perenggan
// dipulangkan dengan "he helped his team" sepanjang cerita, kemudian bertukar
// ke "she doesn't play for attention" di tengah petikan yang sama. Dia seorang
// budak perempuan. Pengesah tidak boleh menangkap ini — teksnya lancar, panjang
// munasabah, dan tiada perkataan Melayu tinggal. Hanya mata manusia, atau
// fakta luaran, boleh membetulkannya.
//
// Nama Melayu MEMBAWA fakta itu secara eksplisit. "binti" bermaksud anak
// perempuan kepada, "bin" bermaksud anak lelaki kepada. Ia bukan tekaan
// daripada nama pertama (yang memang tidak boleh dipercayai merentas budaya) —
// ia penanda nasab yang sudah tertulis dalam nama itu sendiri.
//
// HAD PENGGUNAAN. Ini SAH untuk biografi subjek-tunggal sahaja: rekod Hall of
// Honour, di mana setiap "dia" merujuk orang yang sama. JANGAN gunakannya pada
// badan berita — satu artikel menyebut pemain lelaki, pemain perempuan dan
// jurulatih dalam perenggan yang sama, dan meratakan semuanya kepada satu
// jantina lebih teruk daripada tekaan mesin.
// ============================================================================

export type Jantina = "lelaki" | "perempuan";

/**
 * Kesan jantina daripada penanda nasab dalam nama.
 *
 * Memulangkan null apabila tiada penanda dijumpai — dan null bermakna JANGAN
 * SENTUH APA-APA. Tiada tekaan daripada nama pertama: "Adelia" mungkin
 * kelihatan perempuan kepada pembaca Melayu dan tidak bermakna apa-apa kepada
 * yang lain, dan meneka salah pada rekod kekal seorang kanak-kanak ialah
 * kerosakan yang tepat cuba dielakkan oleh fail ini.
 */
export function jantinaDariNama(...nama: (string | null | undefined)[]): Jantina | null {
  const teks = nama.filter(Boolean).join(" ").toLowerCase();
  if (!teks.trim()) return null;

  // Perempuan diperiksa dahulu semata-mata untuk kejelasan; sempadan perkataan
  // sudah menghalang "bin" daripada memadan dalam "binti" ("t" ialah aksara
  // perkataan, jadi \bbin\b gagal di situ).
  if (/\b(binti|bte|bt)\b/.test(teks)) return "perempuan";
  if (/\ba\/p\b|\banak perempuan\b/.test(teks)) return "perempuan";
  if (/\bbin\b/.test(teks)) return "lelaki";
  if (/\ba\/l\b|\banak lelaki\b/.test(teks)) return "lelaki";
  return null;
}

// Perkataan yang, apabila mengikut "her"/"his", menandakan kata ganti itu
// BERDIRI SENDIRI dan bukan penentu milik. "I saw her yesterday" ialah objek;
// "her team" ialah milik. Tanpa senarai ini, "saw her yesterday" menjadi "saw
// his yesterday" apabila menukar ke lelaki.
const BUKAN_KATA_NAMA = new Set([
  "and", "or", "but", "so", "then", "than", "as", "that", "which", "who",
  "when", "while", "after", "before", "since", "until", "if", "because",
  "to", "in", "on", "at", "for", "with", "from", "by", "into", "onto",
  "again", "too", "also", "yet", "still", "now", "here", "there",
  "today", "yesterday", "tomorrow", "back", "out", "up", "down", "off",
  "is", "was", "are", "were", "has", "have", "had", "will", "would",
]);

// Kata kerja sebab-akibat dan persepsi mengambil OBJEK diikuti kata kerja
// dasar: "make her stand out", "help her win", "saw her play". Tanpa semakan
// ini, "make her stand out" menjadi "make his stand out" — perkataan selepas
// ("stand") kelihatan seperti kata nama tetapi ia kata kerja.
const KATA_KERJA_OBJEK = new Set([
  "make", "makes", "made", "let", "lets", "help", "helps", "helped",
  "see", "sees", "saw", "watch", "watches", "watched",
  "hear", "hears", "heard", "get", "gets", "got", "have", "has", "had",
  "want", "wants", "wanted", "give", "gives", "gave", "tell", "tells", "told",
]);

// Kata kerja dasar yang lazim mengikut objek dalam binaan itu: "stand out",
// "win", "play". Senarai ini WAJIB disemak bersama KATA_KERJA_OBJEK — kata
// kerja sebab-akibat sahaja tidak mencukupi, kerana "helped her team" juga
// dimulakan "helped" tetapi "team" ialah kata nama dan "her" di situ milik.
const KATA_KERJA_DASAR = new Set([
  "stand", "win", "play", "score", "grow", "shine", "succeed", "go", "come",
  "run", "feel", "look", "become", "continue", "keep", "improve", "develop",
  "do", "take", "learn", "train", "lead", "reach", "rise", "believe", "try",
]);

/** Adakah kata ganti pada kedudukan ini kata nama milik (bukan objek)? */
function milikBukanObjek(sebelum: string, selepas: string): boolean {
  const m = selepas.match(/^\s+([A-Za-z']+)/);
  if (!m) return false; // hujung ayat atau tanda baca → berdiri sendiri
  const seterusnya = m[1].toLowerCase();
  if (BUKAN_KATA_NAMA.has(seterusnya)) return false;

  // Objek + kata kerja dasar: "make her stand out", "helped her win".
  // KEDUA-DUA hujung mesti sepadan, jika tidak "helped her team" tersalah
  // baca sebagai objek dan menjadi "helped hers team".
  const sblm = sebelum.match(/([A-Za-z']+)\s+$/);
  if (sblm && KATA_KERJA_OBJEK.has(sblm[1].toLowerCase()) && KATA_KERJA_DASAR.has(seterusnya)) {
    return false;
  }
  return true;
}

/** Kekalkan bentuk huruf besar perkataan asal. */
function ikutHurufBesar(asal: string, ganti: string): string {
  if (asal === asal.toUpperCase() && asal.length > 1) return ganti.toUpperCase();
  if (asal[0] === asal[0].toUpperCase()) return ganti[0].toUpperCase() + ganti.slice(1);
  return ganti;
}

/**
 * Seragamkan kata ganti diri Inggeris kepada satu jantina.
 *
 * Ini membaiki tekaan mesin, bukan menulis semula prosa. Ia hanya menyentuh
 * kata ganti; setiap perkataan lain dikekalkan seperti dipulangkan
 * perkhidmatan.
 */
export function seragamkanKataGanti(teks: string, jantina: Jantina | null): string {
  if (!teks || !jantina) return teks;

  const RE = /\b(he|him|his|himself|she|her|hers|herself)\b/gi;
  return teks.replace(RE, (padan, _g, indeks: number) => {
    const rendah = padan.toLowerCase();
    const selepas = teks.slice(indeks + padan.length);
    const sebelum = teks.slice(0, indeks);

    if (jantina === "perempuan") {
      switch (rendah) {
        case "he": return ikutHurufBesar(padan, "she");
        case "him": return ikutHurufBesar(padan, "her");
        // "his team" → "her team"; "the ball was his" → "... was hers"
        case "his": return ikutHurufBesar(padan, milikBukanObjek(sebelum, selepas) ? "her" : "hers");
        case "himself": return ikutHurufBesar(padan, "herself");
        default: return padan; // sudah perempuan
      }
    }

    switch (rendah) {
      case "she": return ikutHurufBesar(padan, "he");
      // "her team" → "his team"; "saw her yesterday" → "saw him yesterday"
      case "her": return ikutHurufBesar(padan, milikBukanObjek(sebelum, selepas) ? "his" : "him");
      case "hers": return ikutHurufBesar(padan, "his");
      case "herself": return ikutHurufBesar(padan, "himself");
      default: return padan; // sudah lelaki
    }
  });
}
