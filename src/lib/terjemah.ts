import "server-only";
import { dariKamus, medanPendek, terlaluPendek } from "@/lib/kamus";

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
  // SENGAJA PENDEK. Versi pertama melindungi lima belas istilah — Stingers,
  // MSSM, SUKMA, SKTD, Hoki.my dan seterusnya. Ujian menunjukkan MyMemory
  // sudah pun mengekalkan kesemuanya tanpa bantuan, jadi token itu tidak
  // membeli apa-apa; ia hanya membebankan setiap ayat dengan penanda.
  //
  // Kos sebenarnya dilihat pada data: ayat yang tebal dengan token
  // diterjemah separuh jalan, dan satu token dirosakkan menjadi
  // "XNTX1XXNTX" sehingga pemulihan tidak mengenalinya lagi.
  //
  // Yang tinggal ialah perkara yang benar-benar rosak tanpa perlindungan:
  // zarah nama Melayu. "binti" menjadi "bint". Nama penuh pemain dihantar
  // oleh pemanggil dan disertakan bersama senarai ini.
  "binti",
  "bin",
  "a/l",
  "a/p",
];

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
    // Padanan longgar untuk token yang dirosakkan mesin.
    hasil = hasil.replace(new RegExp(`X+\\s*N\\s*T\\s*X+\\s*${i}\\s*X+\\s*N\\s*T\\s*X+`, "gi"), asal);
  });
  // Jaring keselamatan: mana-mana token yang terlepas dibuang, kerana
  // "XNTX3XNTX" yang bocor ke halaman awam lebih teruk daripada satu
  // perkataan yang hilang.
  // Ruang dirapikan, TETAPI baris baharu dikekalkan — sempadan perenggan
  // ialah kandungan.
  return hasil
    // Corak longgar dengan sengaja: mesin boleh menyelitkan aksara ke dalam
    // token ("XNTX1XXNTX" diperhati pada data sebenar), dan token yang
    // dirosakkan mesti tetap hilang. Lebih baik satu perkataan hilang
    // daripada "XNTX1XXNTX" muncul pada halaman awam.
    .replace(/X+\s*N\s*T\s*X+\s*\d+\s*X*\s*N?\s*T?\s*X*/gi, "")
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

// ============================================================================
// PENGESAHAN — tapisan terakhir sebelum apa-apa disimpan.
//
// Terjemahan mesin percuma kadangkala gagal dengan cara yang kelihatan
// seperti berjaya: ia memulangkan teks sumber tidak berubah, menterjemah
// separuh ayat sahaja, atau menyelitkan mesej kuotanya sendiri. Tanpa
// pemeriksaan, semua itu tersimpan ke pangkalan data dan dipaparkan kepada
// pembaca sebagai "Bahasa Inggeris".
//
// Ini bermakna tiada siapa perlu membaca setiap terjemahan sebelum menyiar.
// Apa yang tidak lulus tidak disimpan, dan halaman itu memaparkan bahasa
// Melayu — hasil yang jujur, dan bukan Inggeris yang rosak.
// ============================================================================

// Kata tugas Melayu. Kehadirannya dalam teks "Inggeris" bermakna terjemahan
// tidak berlaku, atau hanya berlaku separuh.
const KATA_MELAYU =
  /\b(yang|dengan|untuk|adalah|telah|dalam|akan|daripada|kepada|beliau|mereka|serta|oleh|pada|ini|itu|kerana|sebagai|antara|selepas|apabila)\b/gi;

export type Semakan = { lulus: boolean; sebab?: string };

export function sahkanTerjemahan(asal: string, hasil: string): Semakan {
  const t = hasil.trim();
  if (!t) return { lulus: false, sebab: "kosong" };

  // Token yang bocor atau dirosakkan.
  if (/X+\s*N\s*T\s*X+\s*\d/i.test(t)) return { lulus: false, sebab: "token bocor" };

  // Mesej perkhidmatan yang menyamar sebagai terjemahan.
  if (/MYMEMORY|QUOTA|USAGE LIMIT|TRANSLATIONS FOR TODAY/i.test(t)) {
    return { lulus: false, sebab: "mesej perkhidmatan" };
  }

  // Teks sumber dipulangkan tidak berubah.
  const ringkas = (x: string) => x.toLowerCase().replace(/[^a-z0-9]+/g, "");
  if (ringkas(t) === ringkas(asal)) return { lulus: false, sebab: "tidak berubah" };

  // Panjang yang tidak munasabah — terjemahan Inggeris bagi teks Melayu
  // biasanya antara 70% dan 160% panjang asalnya.
  const nisbah = t.length / Math.max(asal.length, 1);
  if (nisbah < 0.5 || nisbah > 2.2) {
    return { lulus: false, sebab: `panjang ganjil (${nisbah.toFixed(2)}x)` };
  }

  // Masih berbahasa Melayu. Diukur setiap 100 patah supaya artikel panjang
  // tidak dihukum hanya kerana ia panjang; satu atau dua petikan Melayu
  // dalam teks Inggeris adalah wajar dan dibenarkan.
  const patah = t.split(/\s+/).length;
  const melayu = (t.match(KATA_MELAYU) || []).length;
  if (patah >= 12 && (melayu * 100) / patah > 4) {
    return { lulus: false, sebab: `masih BM (${melayu} kata tugas / ${patah} patah)` };
  }

  return { lulus: true };
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

  // Kamus dahulu, TETAPI hanya untuk medan pendek. Ia tepat, serta-merta,
  // dan tidak menggunakan kuota — dan ia tidak boleh menyentuh prosa.
  if (medanPendek(teks)) {
    const dariSenarai = dariKamus(teks);
    if (dariSenarai) return dariSenarai;
  }

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
    if (!en) continue;
    // Tapisan terakhir. Medan yang tidak lulus TIDAK disimpan, jadi halaman
    // jatuh balik ke bahasa Melayu dan tiada siapa perlu menyemaknya dengan
    // tangan sebelum menyiar.
    const semak = sahkanTerjemahan(nilai ?? "", en);
    if (!semak.lulus) {
      console.warn(`[terjemah] medan "${kunci}" ditolak: ${semak.sebab}`);
      continue;
    }
    hasil[kunci] = en;
  }
  return hasil;
}
