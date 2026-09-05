// Isi terjemahan Inggeris untuk kandungan yang SUDAH tersiar.
//
// Dijalankan sekali selepas migrasi. Selepas ini, setiap berita atau rekod
// baharu diterjemah sendiri semasa terbit.
//
// Guna: node scripts/isi-terjemahan.mjs
//
// Selamat dijalankan berulang kali: baris yang sudah mempunyai terjemahan
// dilangkau, jadi larian yang terputus separuh jalan boleh disambung.

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

const GLOSARI = [
  "Strike Hard. Strike Fast.", "SK Taman Desaminium", "Stingers Hockey",
  "Hustle Gear", "Hall of Honour", "Stingers", "Hoki.my", "SKTD",
  "MSSD", "MSSS", "MSSM", "MSSN", "SUKMA", "KATMO", "MyStaGe",
  "binti", "bin", "a/l", "a/p",
];
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
  peta.forEach((asal, i) => { h = h.replace(new RegExp(`XNTX\\s*${i}\\s*XNTX`, "gi"), asal); });
  return h.replace(/XNTX\s*\d+\s*XNTX/gi, "").replace(/[^\S\n]{2,}/g, " ").replace(/\n{3,}/g, "\n\n").trim();
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

async function medan(obj, lindung = []) {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    const en = await terjemah(v, lindung);
    if (en) out[k] = en;
  }
  return out;
}

// ── Berita ──────────────────────────────────────────────────────────────
const { data: berita, error: eB } = await sb
  .from("news")
  .select("id, title, body, translations")
  .order("published_at", { ascending: false });
if (eB) { console.error("✗ baca berita:", eB.message); process.exit(1); }

let siap = 0, langkau = 0, gagal = 0;
for (const n of berita ?? []) {
  if (n.translations?.en?.title) { langkau++; continue; }
  const en = await medan({ title: n.title, body: n.body });
  if (!Object.keys(en).length) { gagal++; console.warn(`  ⚠ gagal: ${n.title.slice(0, 50)}`); continue; }
  const { error } = await sb.from("news").update({ translations: { en } }).eq("id", n.id);
  if (error) { gagal++; console.warn(`  ⚠ simpan gagal: ${error.message}`); continue; }
  siap++;
  console.log(`  ✓ ${n.title.slice(0, 60)}`);
}
console.log(`\nBerita: ${siap} diterjemah, ${langkau} dilangkau, ${gagal} gagal.`);

// ── Hall of Honour ──────────────────────────────────────────────────────
const { data: legasi, error: eL } = await sb
  .from("legacy_records")
  .select("id, slug, full_name, name_first, name_last, story, quote_text, quote_by, result, category, event, translations")
  .eq("status", "published");
if (eL) { console.error("✗ baca legasi:", eL.message); process.exit(1); }

let siapL = 0, langkauL = 0, gagalL = 0;
for (const r of legasi ?? []) {
  if (r.translations?.en?.story) { langkauL++; continue; }
  const lindung = [r.full_name, r.name_first, r.name_last, r.quote_by]
    .filter(Boolean)
    .flatMap((n) => [n, ...n.split(/\s+/)])
    .filter((w) => w.length > 2);
  const en = await medan(
    { story: r.story, quoteText: r.quote_text, result: r.result, category: r.category, event: r.event },
    lindung,
  );
  if (!Object.keys(en).length) { gagalL++; console.warn(`  ⚠ gagal: ${r.slug}`); continue; }
  const { error } = await sb.from("legacy_records").update({ translations: { en } }).eq("id", r.id);
  if (error) { gagalL++; console.warn(`  ⚠ simpan gagal: ${error.message}`); continue; }
  siapL++;
  console.log(`  ✓ ${r.slug}`);
}
console.log(`\nLegasi: ${siapL} diterjemah, ${langkauL} dilangkau, ${gagalL} gagal.`);
