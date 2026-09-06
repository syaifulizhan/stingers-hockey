// Isi terjemahan Inggeris untuk kandungan yang SUDAH tersiar.
//
// Dijalankan sekali selepas migrasi. Selepas ini, setiap berita atau rekod
// baharu diterjemah sendiri semasa terbit.
//
// Guna: node scripts/isi-terjemahan.mjs
//
// Selamat dijalankan berulang kali: baris yang sudah mempunyai terjemahan
// dilangkau, jadi larian yang terputus separuh jalan boleh disambung.
//
// Penapis untuk tampalan bersasar (larian separa yang perlu disambung):
//   --slug=a,b        hanya rekod legasi ini
//   --medan=x,y       hanya medan ini (story, quoteText, result, category, event)
//   --langkau-berita  jangan sentuh jadual berita langsung
//
// KENAPA PENAPIS MEDAN WUJUD. Medan pendek berformula (result, category,
// event) dikendalikan pada masa render oleh kamus dalam src/lib/kamus.ts, dan
// terjemahan TERSIMPAN mengatasi kamus itu. Menghantar medan sebegitu ke
// perkhidmatan mesin lalu menyimpan hasilnya boleh MENGGANTIKAN keluaran kamus
// yang baik dengan tekaan yang lebih teruk, secara kekal. Untuk medan pendek,
// biarkan kamus bekerja; guna perkhidmatan untuk prosa sahaja.

import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

function envDariFail() {
  try {
    const teks = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
    return Object.fromEntries(
      teks
        .split("\n")
        .filter((b) => b.includes("=") && !b.trim().startsWith("#"))
        .map((b) => {
          const i = b.indexOf("=");
          return [b.slice(0, i).trim(), b.slice(i + 1).trim().replace(/^['"]|['"]$/g, "")];
        }),
    );
  } catch {
    return {};
  }
}

const env = { ...envDariFail(), ...process.env };
// --paksa: terjemah semula walaupun terjemahan sudah wujud.
const PAKSA = process.argv.includes("--paksa");
const LANGKAU_BERITA = process.argv.includes("--langkau-berita");
// --kering: terjemah dan sahkan, papar hasilnya, TETAPI jangan tulis ke DB.
// Menulis ke legacy_records ialah tindakan sehala pada jadual rekod kekal;
// baca hasilnya dengan mata sendiri dahulu.
const KERING = process.argv.includes("--kering");
const senarai = (nama) => {
  const a = process.argv.find((x) => x.startsWith(`--${nama}=`));
  return a ? a.slice(nama.length + 3).split(",").map((x) => x.trim()).filter(Boolean) : null;
};
const SLUG = senarai("slug");
const MEDAN = senarai("medan");
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const anon = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !(service || anon)) {
  console.error("✗ NEXT_PUBLIC_SUPABASE_URL dan satu kunci Supabase diperlukan.");
  process.exit(1);
}
// Menulis ke baris tersiar memerlukan kunci yang dibenarkan RLS. Kunci awam
// hanya boleh MEMBACA, jadi kunci service digunakan jika ada.
if (!service) {
  console.error("✗ SUPABASE_SERVICE_ROLE_KEY diperlukan untuk menulis terjemahan.");
  process.exit(1);
}
const sb = createClient(url, service, { auth: { persistSession: false } });

// Sengaja pendek: MyMemory sudah mengekalkan nama khas sendiri.
// Token yang berlebihan merosakkan kualiti dan boleh dirosakkan mesin.
const GLOSARI = ["binti", "bin", "a/l", "a/p"];
// Istilah pendek diterjemah dari senarai ini, bukan melalui perkhidmatan.
// MyMemory ialah memori terjemahan: untuk rentetan sangat pendek ia
// memulangkan segmen manusia paling hampir, yang boleh datang dari domain
// tidak berkaitan. Diperhati pada data sebenar: "JOHAN" pulang sebagai
// "SPM Outstanding Student A".
const KAMUS = {
  "johan": "Champion", "naib johan": "Runner-Up", "tempat kedua": "Second Place",
  "tempat ketiga": "Third Place", "tempat keempat": "Fourth Place", "kapten": "Captain",
  "penjaring terbanyak": "Top Scorer", "pemain terbaik": "Best Player",
  "penjaga gol terbaik": "Best Goalkeeper", "saringan": "Qualifier",
  "separuh akhir": "Semi-Final", "suku akhir": "Quarter-Final", "akhir": "Final",
  "peserta": "Participant", "lelaki": "Boys", "perempuan": "Girls",
  "bawah 12": "Under 12", "bawah 15": "Under 15", "bawah 18": "Under 18",
  "12 tahun": "Under 12", "15 tahun": "Under 15", "18 tahun": "Under 18",
  "kejohanan hoki": "Hockey Championship", "kejohanan": "Championship",
  "piala": "Cup", "terbuka": "Open",
};

function dariKamus(teks) {
  const bersih = teks.trim().replace(/\s+/g, " ");
  const terus = KAMUS[bersih.toLowerCase()];
  if (terus) return bersih === bersih.toUpperCase() ? terus.toUpperCase() : terus;
  const pemisah = /\s*[·|\-–—]\s*/;
  if (pemisah.test(bersih)) {
    const bahagian = bersih.split(pemisah);
    const keluar = bahagian.map((b) => {
      const k = KAMUS[b.trim().toLowerCase()];
      if (k) return b === b.toUpperCase() ? k.toUpperCase() : k;
      let sisa = b.trim(); let berubah = false;
      for (const [ms, en] of Object.entries(KAMUS).sort((a, b2) => b2[0].length - a[0].length)) {
        const re = new RegExp(`\\b${ms.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi");
        if (re.test(sisa)) { sisa = sisa.replace(re, en); berubah = true; }
      }
      return berubah ? sisa : b.trim();
    });
    if (keluar.some((k, i) => k !== bahagian[i].trim())) return keluar.join(" · ");
  }
  return null;
}

const terlaluPendek = (t) => t.trim().split(/\s+/).length <= 3;

// ── Jantina dari nama ───────────────────────────────────────────────────
// SALINAN src/lib/jantina.ts. Fail .mjs tidak boleh mengimport TS tanpa
// pemuat, jadi logik ini digandakan seperti KAMUS di atas. Sumber kebenaran
// ialah src/lib/jantina.ts — kemas kini kedua-duanya.
//
// Melayu tiada kata ganti berjantina; perkhidmatan terjemahan MESTI meneka,
// dan ia meneka teruk (diperhati: "he ... his" sepanjang cerita seorang budak
// perempuan, bertukar ke "she" di tengah petikan). "binti"/"bin" ialah penanda
// nasab yang sudah tertulis dalam nama itu — fakta, bukan tekaan.
function jantinaDariNama(...nama) {
  const teks = nama.filter(Boolean).join(" ").toLowerCase();
  if (!teks.trim()) return null;
  if (/\b(binti|bte|bt)\b/.test(teks)) return "perempuan";
  if (/\ba\/p\b|\banak perempuan\b/.test(teks)) return "perempuan";
  if (/\bbin\b/.test(teks)) return "lelaki";
  if (/\ba\/l\b|\banak lelaki\b/.test(teks)) return "lelaki";
  return null; // tiada penanda → JANGAN sentuh apa-apa
}

const BUKAN_KATA_NAMA = new Set(["and","or","but","so","then","than","as","that","which","who","when","while","after","before","since","until","if","because","to","in","on","at","for","with","from","by","into","onto","again","too","also","yet","still","now","here","there","today","yesterday","tomorrow","back","out","up","down","off","is","was","are","were","has","have","had","will","would"]);
const KATA_KERJA_OBJEK = new Set(["make","makes","made","let","lets","help","helps","helped","see","sees","saw","watch","watches","watched","hear","hears","heard","get","gets","got","have","has","had","want","wants","wanted","give","gives","gave","tell","tells","told"]);

const KATA_KERJA_DASAR = new Set(["stand","win","play","score","grow","shine","succeed","go","come","run","feel","look","become","continue","keep","improve","develop","do","take","learn","train","lead","reach","rise","believe","try"]);

function milikBukanObjek(sebelum, selepas) {
  const m = selepas.match(/^\s+([A-Za-z']+)/);
  if (!m) return false;
  const seterusnya = m[1].toLowerCase();
  if (BUKAN_KATA_NAMA.has(seterusnya)) return false;
  // KEDUA-DUA hujung mesti sepadan; jika tidak "helped her team" -> "hers team".
  const sblm = sebelum.match(/([A-Za-z']+)\s+$/);
  if (sblm && KATA_KERJA_OBJEK.has(sblm[1].toLowerCase()) && KATA_KERJA_DASAR.has(seterusnya)) return false;
  return true;
}

function ikutHurufBesar(asal, ganti) {
  if (asal === asal.toUpperCase() && asal.length > 1) return ganti.toUpperCase();
  if (asal[0] === asal[0].toUpperCase()) return ganti[0].toUpperCase() + ganti.slice(1);
  return ganti;
}

function seragamkanKataGanti(teks, jantina) {
  if (!teks || !jantina) return teks;
  return teks.replace(/\b(he|him|his|himself|she|her|hers|herself)\b/gi, (padan, _g, indeks) => {
    const rendah = padan.toLowerCase();
    const selepas = teks.slice(indeks + padan.length);
    const sebelum = teks.slice(0, indeks);
    if (jantina === "perempuan") {
      switch (rendah) {
        case "he": return ikutHurufBesar(padan, "she");
        case "him": return ikutHurufBesar(padan, "her");
        case "his": return ikutHurufBesar(padan, milikBukanObjek(sebelum, selepas) ? "her" : "hers");
        case "himself": return ikutHurufBesar(padan, "herself");
        default: return padan;
      }
    }
    switch (rendah) {
      case "she": return ikutHurufBesar(padan, "he");
      case "her": return ikutHurufBesar(padan, milikBukanObjek(sebelum, selepas) ? "his" : "him");
      case "hers": return ikutHurufBesar(padan, "his");
      case "herself": return ikutHurufBesar(padan, "himself");
      default: return padan;
    }
  });
}

// Kamus hanya untuk medan berformula pendek. Tanpa pengawal ini ia memecah
// badan artikel pada sengkang dan memulangkan teks Melayu sebagai terjemahan.
const medanPendek = (t) => {
  const x = t.trim();
  return !x.includes("\n") && x.length <= 60 && x.split(/\s+/).length <= 8;
};

const MAKS = 380;
const bait = (s) => new TextEncoder().encode(s).length;

function lindungi(teks, tambahan) {
  const istilah = [...new Set([...tambahan, ...GLOSARI])].filter(Boolean).sort((a, b) => b.length - a.length);
  const peta = [];
  let hasil = teks;
  for (const t of istilah) {
    const lari = t.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");
    const re = new RegExp(`${/^\w/.test(t) ? "\\b" : ""}${lari}${/\w$/.test(t) ? "\\b" : ""}`, "gi");
    hasil = hasil.replace(re, (m) => `XNTX${peta.push(m) - 1}XNTX`);
  }
  return { teks: hasil, peta };
}

function pulihkan(teks, peta) {
  let h = teks;
  peta.forEach((asal, i) => { h = h.replace(new RegExp(`X+\\s*N\\s*T\\s*X+\\s*${i}\\s*X+\\s*N\\s*T\\s*X+`, "gi"), asal); });
  return h.replace(/X+\s*N\s*T\s*X+\s*\d+\s*X*\s*N?\s*T?\s*X*/gi, "").replace(/[^\S\n]{2,}/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}

function kepingkan(teks) {
  const ayat = teks.split(/(?<=[.!?])\s+/);
  const keping = [];
  let semasa = "";
  for (const a of ayat) {
    if (bait(a) > MAKS) {
      if (semasa) { keping.push(semasa); semasa = ""; }
      let baki = a;
      while (bait(baki) > MAKS) {
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
    if (bait(cuba) > MAKS) { keping.push(semasa); semasa = a; } else { semasa = cuba; }
  }
  if (semasa.trim()) keping.push(semasa.trim());
  return keping;
}

async function satu(teks) {
  const p = new URLSearchParams({ q: teks, langpair: "ms|en" });
  if (env.MYMEMORY_EMAIL) p.set("de", env.MYMEMORY_EMAIL);
  try {
    const res = await fetch(`https://api.mymemory.translated.net/get?${p}`);
    if (!res.ok) return null;
    const j = await res.json();
    if (Number(j.responseStatus) !== 200) return null;
    const out = j.responseData?.translatedText?.trim();
    if (!out || /MYMEMORY WARNING|QUOTA|USAGE LIMIT/i.test(out)) return null;
    return out;
  } catch { return null; }
}

async function terjemah(teks, lindung = []) {
  if (!teks || !teks.trim()) return null;
  if (medanPendek(teks)) {
    const dari = dariKamus(teks);
    if (dari) return dari;
  }
  if (terlaluPendek(teks)) return null;
  const { teks: selamat, peta } = lindungi(teks, lindung);
  const keluar = [];
  let pertama = true;
  for (const perenggan of selamat.split(/\n\s*\n/)) {
    if (!perenggan.trim()) continue;
    const bahagian = [];
    for (const k of kepingkan(perenggan.trim())) {
      if (!pertama) await new Promise((r) => setTimeout(r, 400));
      pertama = false;
      const hasil = await satu(k);
      if (hasil === null) return null;
      bahagian.push(hasil);
    }
    keluar.push(bahagian.join(" "));
  }
  const g = pulihkan(keluar.join("\n\n"), peta);
  return g || null;
}

// Tapisan terakhir sebelum apa-apa disimpan. Terjemahan mesin percuma
// kadangkala gagal dengan cara yang kelihatan seperti berjaya: teks sumber
// dipulangkan tidak berubah, separuh ayat sahaja diterjemah, atau mesej
// kuota diselitkan. Apa yang tidak lulus tidak disimpan, dan halaman
// memaparkan bahasa Melayu.
const KATA_MELAYU = /\b(yang|dengan|untuk|adalah|telah|dalam|akan|daripada|kepada|beliau|mereka|serta|oleh|pada|ini|itu|kerana|sebagai|antara|selepas|apabila)\b/gi;

function sahkan(asal, hasil) {
  const t = (hasil || "").trim();
  if (!t) return { lulus: false, sebab: "kosong" };
  if (/X+\s*N\s*T\s*X+\s*\d/i.test(t)) return { lulus: false, sebab: "token bocor" };
  if (/MYMEMORY|QUOTA|USAGE LIMIT|TRANSLATIONS FOR TODAY/i.test(t)) return { lulus: false, sebab: "mesej perkhidmatan" };
  const ringkas = (x) => x.toLowerCase().replace(/[^a-z0-9]+/g, "");
  if (ringkas(t) === ringkas(asal)) return { lulus: false, sebab: "tidak berubah" };
  const nisbah = t.length / Math.max(asal.length, 1);
  if (nisbah < 0.5 || nisbah > 2.2) return { lulus: false, sebab: `panjang ganjil (${nisbah.toFixed(2)}x)` };
  const patah = t.split(/\s+/).length;
  const melayu = (t.match(KATA_MELAYU) || []).length;
  if (patah >= 12 && (melayu * 100) / patah > 4) return { lulus: false, sebab: `masih BM (${melayu}/${patah})` };
  return { lulus: true };
}

async function medan(obj, lindung = [], jantina = null) {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    const mentah = await terjemah(v, lindung);
    // Betulkan tekaan jantina SEBELUM sahkan(), supaya apa yang disahkan
    // ialah apa yang disimpan.
    const en = mentah ? seragamkanKataGanti(mentah, jantina) : mentah;
    if (!en) continue;
    const semak = sahkan(v ?? "", en);
    if (!semak.lulus) { console.warn(`     ✗ medan ${k} ditolak: ${semak.sebab}`); continue; }
    out[k] = en;
  }
  return out;
}

// ── Berita ──────────────────────────────────────────────────────────────
const { data: berita, error: eB } = LANGKAU_BERITA
  ? { data: [], error: null }
  : await sb
      .from("news")
      .select("id, title, body, translations")
      .order("published_at", { ascending: false });
if (eB) { console.error("✗ baca berita:", eB.message); process.exit(1); }

let siap = 0, langkau = 0, gagal = 0;
for (const n of berita ?? []) {
  if (!PAKSA && n.translations?.en?.title) { langkau++; continue; }
  const en = await medan({ title: n.title, body: n.body });
  if (!Object.keys(en).length) { gagal++; console.warn(`  ⚠ gagal: ${n.title.slice(0, 50)}`); continue; }
  // GABUNG, jangan ganti. Larian yang separa berjaya — biasanya kerana kuota
  // habis di tengah jalan — sebelum ini memadam medan yang sudah baik
  // daripada larian terdahulu. Diperhati pada data: cerita dan petikan legasi
  // hilang apabila hanya keputusan dan kategori sempat diterjemah.
  const sediaN = (n.translations || {}).en || {};
  if (KERING) {
    console.log(`  [kering] ${n.title.slice(0, 50)} → ${Object.keys(en).join(", ")}`);
    siap++;
    continue;
  }
  const { error } = await sb
    .from("news")
    .update({ translations: { en: { ...sediaN, ...en } } })
    .eq("id", n.id);
  if (error) { gagal++; console.warn(`  ⚠ simpan gagal: ${error.message}`); continue; }
  siap++;
  console.log(`  ✓ ${n.title.slice(0, 60)}`);
}
console.log(LANGKAU_BERITA ? "\nBerita: dilangkau (--langkau-berita)." : `\nBerita: ${siap} diterjemah, ${langkau} dilangkau, ${gagal} gagal.`);

// ── Hall of Honour ──────────────────────────────────────────────────────
const { data: legasi, error: eL } = await sb
  .from("legacy_records")
  .select("id, slug, full_name, name_first, name_last, story, quote_text, quote_by, result, category, event, translations")
  .eq("status", "published");
if (eL) { console.error("✗ baca legasi:", eL.message); process.exit(1); }

let siapL = 0, langkauL = 0, gagalL = 0;
for (const r of legasi ?? []) {
  if (SLUG && !SLUG.includes(r.slug)) { langkauL++; continue; }
  // Dengan penapis medan, "sudah ada story" bukan lagi ujian yang betul —
  // kita mungkin menampal medan lain pada rekod yang story-nya sudah ada.
  const sudahAda = MEDAN
    ? MEDAN.every((m) => r.translations?.en?.[m])
    : Boolean(r.translations?.en?.story);
  if (!PAKSA && sudahAda) { langkauL++; continue; }
  const lindung = [r.full_name, r.name_first, r.name_last, r.quote_by]
    .filter(Boolean)
    .flatMap((n) => [n, ...n.split(/\s+/)])
    .filter((w) => w.length > 2);
  const semua = {
    story: r.story,
    quoteText: r.quote_text,
    result: r.result,
    category: r.category,
    event: r.event,
  };
  const pilihan = MEDAN
    ? Object.fromEntries(Object.entries(semua).filter(([k]) => MEDAN.includes(k)))
    : semua;
  // quoteBy SENGAJA tidak dimasukkan — itu nama jurulatih, bukan subjek rekod.
  const jantina = jantinaDariNama(r.full_name, r.name_first, r.name_last);
  if (jantina) console.log(`     jantina dari nama: ${jantina}`);
  const en = await medan(pilihan, lindung, jantina);
  if (!Object.keys(en).length) { gagalL++; console.warn(`  ⚠ gagal: ${r.slug}`); continue; }
  const sediaL = (r.translations || {}).en || {};
  if (KERING) {
    console.log(`\n  [kering] ${r.slug} — tiada apa ditulis. Hasil untuk semakan:`);
    for (const [k, v] of Object.entries(en)) {
      console.log(`\n  ── ${k} ──\n${v}\n`);
    }
    console.log(`  medan akhir jika disimpan: ${Object.keys({ ...sediaL, ...en }).join(", ")}`);
    siapL++;
    continue;
  }
  const { error } = await sb
    .from("legacy_records")
    .update({ translations: { en: { ...sediaL, ...en } } })
    .eq("id", r.id);
  if (error) { gagalL++; console.warn(`  ⚠ simpan gagal: ${error.message}`); continue; }
  siapL++;
  console.log(`  ✓ ${r.slug}`);
}
console.log(`\nLegasi: ${siapL} diterjemah, ${langkauL} dilangkau, ${gagalL} gagal.`);
