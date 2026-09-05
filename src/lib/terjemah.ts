import "server-only";

// ============================================================================
// TERJEMAHAN AUTOMATIK — Bahasa Melayu ke Bahasa Inggeris.
//
// Teks UI yang ditulis tangan sudah pun dwibahasa melalui t("BM", "EN") dalam
// lib/i18n.tsx. Yang tidak pernah diterjemahkan ialah kandungan pangkalan
// data: berita, cerita Hall of Honour, petikan jurulatih. Pelawat yang
// menekan pil EN mendapat antara muka Inggeris yang dibungkus mengelilingi
// perenggan Melayu.
//
// KENAPA DITERJEMAH SEMASA TERBIT DAN BUKAN SEMASA DILIHAT. Menterjemah pada
// setiap lawatan bermakna: kuota harian habis dibakar oleh perangkak,
// kelewatan rangkaian pada setiap render, dan halaman yang rosak apabila
// perkhidmatan terjemahan tidak menjawab. Diterjemah sekali dan disimpan
// bermakna halaman Inggeris sepantas halaman Melayu, dan ia terus berfungsi
// walaupun perkhidmatan itu hilang esok.
//
// PERKHIDMATAN: MyMemory. Percuma, tiada kunci diperlukan, dan diuji terhadap
// kandungan sebenar laman ini sebelum dipilih. Terjemahan Melayu ke Inggeris
// yang dihasilkannya bagus, dan ia mengekalkan kebanyakan nama khas dengan
// sendirinya - "Stingers Hockey", "Hoki.my", "MSSM", "SUKMA", "Rayyan Cup"
// semuanya keluar tidak berubah.
//
// Tetapi bukan semuanya: "binti" menjadi "bint". Nama seseorang tidak
// sepatutnya berubah ejaan kerana ia melalui mesin, jadi glosari di bawah
// menggantikan istilah terlindung dengan token sebelum menghantar dan
// memulihkannya selepas itu. Token diuji: XNTX0XNTX melepasi terjemahan
// tanpa disentuh.
// ============================================================================

const ENDPOINT = "https://api.mymemory.translated.net/get";

// MyMemory memotong pada kira-kira 500 bait. Diuji: input 478 aksara pulang
// terpotong di tengah perkataan. 380 memberi ruang selamat untuk pengekodan
// URL aksara beraksen.
const MAKS_BAIT = 380;

/**
 * Istilah yang TIDAK PERNAH diterjemahkan.
 *
 * Disusun paling panjang dahulu semasa digunakan, supaya "Stingers Hockey"
 * dipadan sebelum "Stingers" dan tidak berakhir sebagai token separuh.
 */
const GLOSARI = [
  "Strike Hard. Strike Fast.",
  "SK Taman Desaminium",
  "Stingers Hockey",
  "Hustle Gear",
  "Hall of Honour",
  "Stingers",
  "Hoki.my",
  "SKTD",
  "MSSD",
  "MSSS",
  "MSSM",
  "MSSN",
  "SUKMA",
  "KATMO",
  "MyStaGe",
  // Zarah nama Melayu. "binti" menjadi "bint" tanpa perlindungan ini.
  "binti",
  "bin",
  "a/l",
  "a/p",
];

// ============================================================================
// KAMUS ISTILAH PENDEK — diterjemah di sini, bukan melalui perkhidmatan.
//
// MyMemory ialah memori terjemahan: untuk rentetan yang sangat pendek ia
// memulangkan segmen manusia paling hampir yang pernah dilihatnya, dan
// segmen itu boleh datang dari domain yang langsung tiada kaitan. Diperhati
// pada data sebenar: "JOHAN" pulang sebagai "SPM Outstanding Student A".
// Bukan terjemahan yang lemah - jawapan dari dokumen orang lain.
//
// Keputusan dan kategori sukan sekolah ialah set tertutup dan berformula,
// jadi ia diterjemah di sini dengan tepat, serta-merta dan tanpa kuota.
// Apa yang tiada dalam senarai ini dan terlalu pendek untuk dipercayai
// akan kekal dalam bahasa Melayu, dan itu jawapan yang betul: "JOHAN" yang
// tidak diterjemah masih boleh difahami; "SPM Outstanding Student A" tidak.
// ============================================================================

const KAMUS: Record<string, string> = {
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
  "piala": "Cup",
  "terbuka": "Open",
};

/**
 * Cuba terjemah rentetan pendek daripada kamus tempatan.
 *
 * Memulangkan null apabila ia tidak boleh dilakukan dengan yakin. Pemanggil
 * kemudian memutuskan sama ada hendak bertanya kepada perkhidmatan atau
 * mengekalkan bahasa Melayu.
 */
function dariKamus(teks: string): string | null {
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
function terlaluPendek(teks: string): boolean {
  return teks.trim().split(/\s+/).length <= 3;
}

/** Bahagi teks kepada kepingan di bawah had, memotong pada sempadan ayat. */
function kepingkan(teks: string): string[] {
  const ayat = teks.split(/(?<=[.!?])\s+/);
  const keping: string[] = [];
  let semasa = "";

  const bait = (s: string) => new TextEncoder().encode(s).length;

  for (const a of ayat) {
    if (bait(a) > MAKS_BAIT) {
      // Satu ayat yang lebih panjang daripada had: pecah pada koma, kemudian
      // pada ruang. Lebih baik terjemahan yang sedikit janggal daripada teks
      // yang hilang hujungnya.
      if (semasa) {
        keping.push(semasa);
        semasa = "";
      }
      let baki = a;
      while (bait(baki) > MAKS_BAIT) {
        let potong = baki.lastIndexOf(", ", 300);
        if (potong < 60) potong = baki.lastIndexOf(" ", 300);
        if (potong < 60) potong = 300;
        keping.push(baki.slice(0, potong + 1).trim());
        baki = baki.slice(potong + 1);
      }
      if (baki.trim()) semasa = baki.trim();
      continue;
    }
    const cuba = semasa ? `${semasa} ${a}` : a;
    if (bait(cuba) > MAKS_BAIT) {
      keping.push(semasa);
      semasa = a;
    } else {
      semasa = cuba;
    }
  }
  if (semasa.trim()) keping.push(semasa.trim());
  return keping;
}

function lindungi(teks: string, tambahan: string[]) {
  const istilah = [...new Set([...tambahan, ...GLOSARI])]
    .filter(Boolean)
    .sort((a, b) => b.length - a.length);

  const peta: string[] = [];
  let hasil = teks;
  istilah.forEach((t) => {
    const lari = t.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");
    // Sempadan perkataan hanya apabila istilah bermula/berakhir dengan huruf,
    // supaya "Hoki.my" dan "a/l" masih dipadan.
    const re = new RegExp(
      `${/^\w/.test(t) ? "\\b" : ""}${lari}${/\w$/.test(t) ? "\\b" : ""}`,
      "gi"
    );
    hasil = hasil.replace(re, (padan) => {
      const i = peta.push(padan) - 1;
      return `XNTX${i}XNTX`;
    });
  });
  return { teks: hasil, peta };
}

function pulihkan(teks: string, peta: string[]): string {
  let hasil = teks;
  peta.forEach((asal, i) => {
    hasil = hasil.replace(new RegExp(`XNTX\\s*${i}\\s*XNTX`, "gi"), asal);
  });
  // Jaring keselamatan: mana-mana token yang terlepas dibuang, kerana
  // "XNTX3XNTX" yang bocor ke halaman awam lebih teruk daripada satu
  // perkataan yang hilang.
  // Ruang dirapikan, TETAPI baris baharu dikekalkan — sempadan perenggan
  // ialah kandungan.
  return hasil
    .replace(/XNTX\s*\d+\s*XNTX/gi, "")
    .replace(/[^\S\n]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function satuKeping(teks: string): Promise<string | null> {
  const params = new URLSearchParams({ q: teks, langpair: "ms|en" });
  // MyMemory menawarkan kuota harian lebih besar apabila satu alamat e-mel
  // disertakan. Ia diambil dari env dan TIDAK dikodkan keras: alamat e-mel
  // milik seseorang tidak sepatutnya dihantar ke perkhidmatan pihak ketiga
  // hanya kerana kod ini kebetulan mengetahuinya.
  const emel = process.env.MYMEMORY_EMAIL;
  if (emel) params.set("de", emel);

  try {
    const res = await fetch(`${ENDPOINT}?${params}`, {
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      responseStatus?: number | string;
      responseData?: { translatedText?: string };
    };
    if (Number(json.responseStatus) !== 200) return null;
    const keluar = json.responseData?.translatedText?.trim();
    if (!keluar) return null;
    // MyMemory memulangkan mesej kuota sebagai "terjemahan" apabila had
    // dicapai. Itu bukan terjemahan, dan ia tidak sepatutnya disimpan.
    if (/MYMEMORY WARNING|QUOTA|USAGE LIMIT/i.test(keluar)) return null;
    return keluar;
  } catch {
    return null;
  }
}

/**
 * Terjemah satu blok teks. Memulangkan null jika ia gagal sepenuhnya.
 *
 * Null bermakna pemanggil menyimpan bahasa Melayu asal, dan itu keputusan
 * yang betul: perenggan Melayu di bawah antara muka Inggeris masih boleh
 * dibaca, manakala perenggan kosong tidak.
 */
export async function terjemah(
  teks: string | null | undefined,
  lindungTambahan: string[] = []
): Promise<string | null> {
  if (!teks || !teks.trim()) return null;

  // Kamus dahulu. Ia tepat, serta-merta, dan tidak menggunakan kuota.
  const dariSenarai = dariKamus(teks);
  if (dariSenarai) return dariSenarai;

  // Rentetan sangat pendek yang tiada dalam kamus TIDAK dihantar ke
  // perkhidmatan: itulah tepat keadaan di mana memori terjemahan memulangkan
  // segmen orang lain. Null bermakna paparan kekal dengan bahasa Melayu.
  if (terlaluPendek(teks)) return null;

  const { teks: selamat, peta } = lindungi(teks, lindungTambahan);

  // Perenggan diterjemah SATU PERSATU dan disambung semula dengan pemisah
  // asalnya. Versi pertama memecah keseluruhan teks kepada ayat dan
  // menyambungnya dengan ruang, jadi setiap baris kosong hilang: cerita Zahin
  // keluar sebagai "Known as Zahin Zahin's journey in the world of hockey" —
  // dua perenggan bercantum menjadi satu ayat yang mengarut. Kedua-dua berita
  // dan cerita Hall of Honour dipaparkan sebagai perenggan, jadi struktur itu
  // sebahagian daripada kandungan, bukan sekadar jarak.
  const perenggan = selamat.split(/\n\s*\n/);
  const keluarPerenggan: string[] = [];
  let pertama = true;

  for (const p of perenggan) {
    if (!p.trim()) continue;
    const keping = kepingkan(p.trim());
    const keluar: string[] = [];

    for (const k of keping) {
      // Berlaku sopan terhadap perkhidmatan percuma.
      if (!pertama) await new Promise((r) => setTimeout(r, 350));
      pertama = false;

      const hasil = await satuKeping(k);
      // Satu kepingan yang gagal merosakkan keseluruhan blok — separuh
      // Inggeris separuh Melayu di tengah perenggan lebih teruk daripada
      // Melayu sepenuhnya.
      if (hasil === null) return null;
      keluar.push(hasil);
    }
    keluarPerenggan.push(keluar.join(" "));
  }

  const gabung = pulihkan(keluarPerenggan.join("\n\n"), peta);
  return gabung || null;
}

/** Terjemah beberapa medan sekaligus; medan yang gagal ditinggalkan keluar. */
export async function terjemahMedan(
  medan: Record<string, string | null | undefined>,
  lindungTambahan: string[] = []
): Promise<Record<string, string>> {
  const hasil: Record<string, string> = {};
  for (const [kunci, nilai] of Object.entries(medan)) {
    const en = await terjemah(nilai, lindungTambahan);
    if (en) hasil[kunci] = en;
  }
  return hasil;
}
