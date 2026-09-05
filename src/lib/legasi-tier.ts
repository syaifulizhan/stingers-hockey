// ============================================================================
// PERINGKAT — setinggi mana nama itu dibawa.
//
// Hall of Honour bermula dengan satu paras: semua kad kelihatan sama, semuanya
// beraksen amber. Itu memadai untuk dua rekod dari kohort yang sama. Ia mula
// berbohong sebaik angkatan lama masuk, kerana ia menjadikan pemain yang
// mewakili daerah kelihatan setara dengan pemain yang menjadi kapten Malaysia.
//
// Tangga di bawah ialah tangga sukan sekolah Malaysia yang sebenar. Warnanya
// ialah pingat — slate, gangsa, perak, emas. Amber jenama dikhaskan untuk
// anak tangga tertinggi; sebelum ini ia diberikan kepada semua orang, jadi ia
// tidak bermakna apa-apa.
//
// PENTING: warna TIDAK PERNAH menjadi satu-satunya isyarat. Setiap kad juga
// membawa label bertulis ("NEGERI", "NEGARA"), kerana orang yang tidak dapat
// membezakan gangsa daripada emas masih perlu membaca rekod itu.
//
// KENAPA EMAS TIDAK BOLEH MENANG DENGAN WARNA SAHAJA. Percubaan pertama
// menetapkan gangsa #c9793d dan perak #c8d0da, dan gangsa kelihatan LEBIH
// menyerlah daripada perak walaupun ia lebih gelap — kecerahan 0.264 lawan
// 0.625. Sebabnya kepekatan: gangsa 0.549, perak 0.071. Warna panas yang
// pekat memajukan diri; warna neutral berundur. Kecerahan sahaja tidak
// meramalkan apa yang mata panggil "menonjol".
//
// Jadi tangga ini tidak bergantung pada warna sahaja untuk hierarkinya:
//   • kepekatan gangsa diturunkan supaya ia berundur di bawah perak,
//   • perak dicerahkan supaya ia jelas mengatasi gangsa,
//   • dan NEGARA sahaja mendapat pil BERISI PADAT, bukan lorekan lembut.
// Anak tangga teratas menang secara struktur, bukan pertandingan warna yang
// boleh kalah pada skrin lain.
// ============================================================================

export const PERINGKAT = ["daerah", "negeri", "kebangsaan", "negara"] as const;

export type LegacyTier = (typeof PERINGKAT)[number];

export type TakrifPeringkat = {
  /** Label pada kad. */
  nama: string;
  namaEn: string;
  /** Badan yang menganjurkan pada paras itu — konteks untuk ibu bapa. */
  ringkas: string;
  /** Tinggi pada tangga. Lebih besar lebih tinggi. */
  aras: number;
  /** Warna aksen — teks keputusan, jalur kad, sempadan. */
  warna: string;
  /** Warna aksen pada latar lembut, untuk isian dan sempadan. */
  lembut: string;
  /** Warna teks di ATAS `warna` bila digunakan sebagai isian pekat. */
  atasWarna: string;
  /**
   * Papar pil sebagai isian PADAT dan bukan lorekan lembut.
   *
   * Hanya anak tangga teratas. Inilah yang menjadikan hierarki tidak boleh
   * salah baca: emas ialah satu-satunya lencana berisi pada halaman itu.
   */
  padat?: boolean;
};

export const TIER: Record<LegacyTier, TakrifPeringkat> = {
  daerah: {
    nama: "Daerah",
    namaEn: "District",
    ringkas: "MSSD",
    aras: 1,
    warna: "#7f8894",
    lembut: "rgba(127, 136, 148, 0.16)",
    atasWarna: "#0a0a0a",
  },
  negeri: {
    nama: "Negeri",
    namaEn: "State",
    ringkas: "MSSS",
    aras: 2,
    // Kepekatan diturunkan dari 0.549 ke 0.384: gangsa yang terlalu pekat
    // menewaskan perak walaupun jauh lebih gelap.
    warna: "#b07a4e",
    lembut: "rgba(176, 122, 78, 0.16)",
    atasWarna: "#0a0a0a",
  },
  kebangsaan: {
    nama: "Kebangsaan",
    namaEn: "National Schools",
    // SUKMA dikira di sini juga — ia peringkat kebangsaan, bukan sekolah.
    ringkas: "MSSM / SUKMA",
    aras: 3,
    warna: "#dfe6ee",
    lembut: "rgba(223, 230, 238, 0.14)",
    atasWarna: "#0a0a0a",
  },
  negara: {
    nama: "Negara",
    namaEn: "National Team",
    ringkas: "Malaysia",
    aras: 4,
    warna: "#f5b400",
    lembut: "rgba(245, 180, 0, 0.16)",
    atasWarna: "#0a0a0a",
    padat: true,
  },
};

/** Takrif bagi satu peringkat, atau null jika belum ditetapkan. */
export function takrif(tier: LegacyTier | null | undefined): TakrifPeringkat | null {
  return tier ? (TIER[tier] ?? null) : null;
}

/**
 * Warna aksen untuk sesuatu rekod.
 *
 * Rekod tanpa peringkat mengekalkan amber seperti sebelum ini. Rekod yang
 * sudah tersiar tidak boleh bertukar rupa hanya kerana lajur baharu ditambah —
 * ia menjadi tenang selepas admin menetapkan peringkatnya.
 */
export function warnaAksen(tier: LegacyTier | null | undefined): string {
  return takrif(tier)?.warna ?? "#f5b400";
}

/**
 * Slug rekod yang membawa peringkat TERTINGGI dalam kohort masing-masing.
 *
 * Inilah yang menghormati pemain yang hanya sampai ke peringkat negeri tetapi
 * merupakan orang yang pergi paling jauh dalam angkatannya. Ia dikira daripada
 * data, bukan ditanda tangan, jadi ia tidak boleh menjadi lapuk.
 *
 * Kohort yang hanya mempunyai satu rekod dilangkau: memanggil satu-satunya
 * nama sebagai "tertinggi" tidak memberitahu sesiapa apa-apa.
 */
export function tertinggiTiapKohort(
  records: { slug: string; cohort: number; tier?: LegacyTier | null }[]
): Set<string> {
  const ikutKohort = new Map<number, typeof records>();
  for (const r of records) {
    const senarai = ikutKohort.get(r.cohort) ?? [];
    senarai.push(r);
    ikutKohort.set(r.cohort, senarai);
  }

  const tertinggi = new Set<string>();
  for (const senarai of ikutKohort.values()) {
    if (senarai.length < 2) continue;
    const aras = senarai.map((r) => takrif(r.tier)?.aras ?? 0);
    const puncak = Math.max(...aras);
    // 0 bermakna tiada seorang pun dalam kohort itu mempunyai peringkat —
    // tiada apa untuk dibandingkan, jadi tiada apa untuk ditandakan. `continue`
    // dan bukan `return`: kohort ini dilangkau, bukan yang selebihnya.
    if (puncak === 0) continue;
    senarai.forEach((r, i) => {
      if (aras[i] === puncak) tertinggi.add(r.slug);
    });
  }
  return tertinggi;
}
