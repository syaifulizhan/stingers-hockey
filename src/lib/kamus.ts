// ============================================================================
// KAMUS ISTILAH — selamat untuk pelayan DAN pelayar.
//
// Diasingkan daripada lib/terjemah.ts kerana ia diperlukan di kedua-dua
// tempat, dan terjemah.ts ialah "server-only". Enjin terjemahan menggunakannya
// sebelum memanggil perkhidmatan; komponen paparan menggunakannya secara
// terus, pada masa render.
//
// KENAPA PAPARAN MEMERLUKANNYA. Sebahagian teks pangkalan data tidak berbaloi
// disimpan terjemahannya: kategori perlawanan seperti "Group C (PEREMPUAN)"
// sudah separuh Inggeris, dan menghantarnya ke perkhidmatan terjemahan
// membakar kuota untuk menukar satu perkataan. Kamus melakukannya serta-merta,
// tanpa kuota, dan tidak boleh menghasilkan sampah kerana ia hanya menggantikan
// istilah yang dikenali.
//
// Nama khas SENGAJA tidak disentuh. "SK Seri Selangor (B)" ialah nama sekolah
// dan "SSNS, Seksyen 11, Shah Alam" ialah alamat; menterjemahkannya bukan
// membantu sesiapa, ia merosakkan maklumat.
// ============================================================================

export const KAMUS: Record<string, string> = {
  "johan": "Champion",
  "naib johan": "Runner-Up",
  "tempat kedua": "Second Place",
  "tempat ketiga": "Third Place",
  "tempat keempat": "Fourth Place",
  "kapten": "Captain",
  "penjaring terbanyak": "Top Scorer",
  "pemain terbaik": "Best Player",
  "penjaga gol terbaik": "Best Goalkeeper",
  "saringan": "Qualifier",
  "separuh akhir": "Semi-Final",
  "suku akhir": "Quarter-Final",
  "akhir": "Final",
  "peserta": "Participant",
  "lelaki": "Boys",
  "perempuan": "Girls",
  "bawah 12": "Under 12",
  "bawah 15": "Under 15",
  "bawah 18": "Under 18",
  "12 tahun": "Under 12",
  "15 tahun": "Under 15",
  "18 tahun": "Under 18",
  "kejohanan hoki": "Hockey Championship",
  "kejohanan": "Championship",
  // Frasa penuh mesti didahulukan: bahasa Melayu meletakkan kepala frasa di
  // hadapan ("Piala Pengetua") dan Inggeris di belakang ("Principal's Cup"),
  // jadi penggantian kata demi kata menghasilkan "Cup Principal" yang salah.
  // Senarai disusun paling panjang dahulu semasa digunakan, jadi frasa
  // sentiasa menang ke atas perkataan tunggal.
  "piala pengetua": "Principal's Cup",
  "piala": "Cup",
  "pengetua": "Principal",
  "kumpulan": "Group",
  "peringkat": "Stage",
  "pusingan": "Round",
  "sekolah": "School",
  "hoki": "Hockey",
  "terbuka": "Open",
};

/**
 * Adakah rentetan ini cukup pendek untuk kamus dipercayai?
 *
 * Kamus direka untuk medan berformula: "JOHAN", "Lelaki 12 Tahun - Selangor".
 * Ia MESTI TIDAK menyentuh prosa. Versi pertama tidak mempunyai pengawal ini,
 * dan laluan pemisahnya memecah keseluruhan badan artikel pada sengkang,
 * menggantikan beberapa perkataan, dan memulangkan hasilnya sebagai
 * "terjemahan" - sepuluh daripada dua belas artikel disimpan sebagai teks
 * Melayu yang hampir tidak berubah. Kamus hanya berpeluang pada rentetan
 * pendek satu baris.
 */
export function medanPendek(teks: string): boolean {
  const t = teks.trim();
  return !t.includes("\n") && t.length <= 60 && t.split(/\s+/).length <= 8;
}

/**
 * Cuba terjemah rentetan pendek daripada kamus tempatan.
 *
 * Memulangkan null apabila ia tidak boleh dilakukan dengan yakin. Pemanggil
 * kemudian memutuskan sama ada hendak bertanya kepada perkhidmatan atau
 * mengekalkan bahasa Melayu.
 */
export function dariKamus(teks: string): string | null {
  const bersih = teks.trim().replace(/\s+/g, " ");
  const terus = KAMUS[bersih.toLowerCase()];
  if (terus) return bersih === bersih.toUpperCase() ? terus.toUpperCase() : terus;

  // Rentetan berbentuk "Lelaki 12 Tahun - Selangor": setiap bahagian dicuba
  // secara berasingan, dan bahagian yang tidak dikenali dikekalkan seadanya
  // kerana ia hampir selalunya nama tempat.
  const pemisah = /\s*[·|\-–—]\s*/;
  if (pemisah.test(bersih)) {
    const bahagian = bersih.split(pemisah);
    const keluar = bahagian.map((b) => {
      const k = KAMUS[b.trim().toLowerCase()];
      if (k) return b === b.toUpperCase() ? k.toUpperCase() : k;
      // Frasa dalam bahagian: "Lelaki 12 Tahun" -> "Boys Under 12"
      let sisa = b.trim();
      let berubah = false;
      for (const [ms, en] of Object.entries(KAMUS).sort((a, b2) => b2[0].length - a[0].length)) {
        const re = new RegExp(`\\b${ms.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi");
        if (re.test(sisa)) {
          sisa = sisa.replace(re, en);
          berubah = true;
        }
      }
      return berubah ? sisa : b.trim();
    });
    if (keluar.some((k, i) => k !== bahagian[i].trim())) return keluar.join(" · ");
  }
  return null;
}

/** Terlalu pendek untuk dipercayai daripada memori terjemahan. */
export function terlaluPendek(teks: string): boolean {
  return teks.trim().split(/\s+/).length <= 3;
}

/**
 * Terapkan kamus pada teks paparan mengikut bahasa semasa.
 *
 * Memulangkan teks asal apabila bahasa ialah Melayu, atau apabila tiada
 * istilah yang dikenali di dalamnya. Ia tidak pernah memulangkan kosong.
 */
export function istilah(teks: string | null | undefined, lang: string): string {
  const t = (teks ?? "").trim();
  if (!t || lang !== "en") return teks ?? "";

  const terus = KAMUS[t.toLowerCase()];
  if (terus) return t === t.toUpperCase() ? terus.toUpperCase() : terus;

  // Gantikan istilah yang dikenali di dalam rentetan, kekalkan selebihnya.
  // "Group C (PEREMPUAN)" menjadi "Group C (GIRLS)"; nama sekolah dan alamat
  // di sekelilingnya tidak disentuh.
  let hasil = t;
  for (const [ms, en] of Object.entries(KAMUS).sort((a, b) => b[0].length - a[0].length)) {
    const re = new RegExp(`\\b${ms.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi");
    hasil = hasil.replace(re, (padan) =>
      padan === padan.toUpperCase() ? en.toUpperCase() : en,
    );
  }
  return hasil;
}
