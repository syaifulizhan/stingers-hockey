// Jalankan pengesah ke atas terjemahan yang SUDAH tersimpan, dan buang medan
// yang tidak lulus.
//
// Tiada panggilan terjemahan langsung — ia hanya membaca, menilai, dan
// membuang. Digunakan selepas pengesah diperketat, supaya kandungan yang
// tersimpan sebelum pengesah wujud tidak kekal dipaparkan sebagai "Inggeris".
//
// Guna: node scripts/tapis-terjemahan.mjs

import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

function envDariFail() {
  try {
    const teks = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
    return Object.fromEntries(
      teks.split("\n").filter((b) => b.includes("=") && !b.trim().startsWith("#")).map((b) => {
        const i = b.indexOf("=");
        return [b.slice(0, i).trim(), b.slice(i + 1).trim().replace(/^['"]|['"]$/g, "")];
      }),
    );
  } catch { return {}; }
}
const env = { ...envDariFail(), ...process.env };
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const KATA_MELAYU = /\b(yang|dengan|untuk|adalah|telah|dalam|akan|daripada|kepada|beliau|mereka|serta|oleh|pada|ini|itu|kerana|sebagai|antara|selepas|apabila)\b/gi;

function sahkan(asal, hasil) {
  const t = (hasil || "").trim();
  if (!t) return { lulus: false, sebab: "kosong" };
  if (/X+\s*N\s*T\s*X+\s*\d/i.test(t)) return { lulus: false, sebab: "token bocor" };
  if (/MYMEMORY|QUOTA|USAGE LIMIT|TRANSLATIONS FOR TODAY/i.test(t)) return { lulus: false, sebab: "mesej perkhidmatan" };
  const ringkas = (x) => (x || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
  if (ringkas(t) === ringkas(asal)) return { lulus: false, sebab: "tidak berubah" };
  const nisbah = t.length / Math.max((asal || "").length, 1);
  if (nisbah < 0.5 || nisbah > 2.2) return { lulus: false, sebab: `panjang ganjil (${nisbah.toFixed(2)}x)` };
  const patah = t.split(/\s+/).length;
  const melayu = (t.match(KATA_MELAYU) || []).length;
  if (patah >= 12 && (melayu * 100) / patah > 4) return { lulus: false, sebab: `masih BM (${melayu}/${patah})` };
  return { lulus: true };
}

async function tapis(jadual, medanAsal, label) {
  const pilih = ["id", label, ...Object.values(medanAsal), "translations"].join(", ");
  const { data, error } = await sb.from(jadual).select(pilih);
  if (error) { console.error(`✗ ${jadual}:`, error.message); return; }

  let ubah = 0, buang = 0;
  for (const r of data ?? []) {
    const en = (r.translations || {}).en;
    if (!en) continue;
    const baharu = {};
    for (const [kunci, nilai] of Object.entries(en)) {
      const asal = r[medanAsal[kunci]] ?? "";
      const s = sahkan(asal, nilai);
      if (s.lulus) baharu[kunci] = nilai;
      else { buang++; console.log(`  ✗ ${r[label]} / ${kunci}: ${s.sebab}`); }
    }
    if (Object.keys(baharu).length !== Object.keys(en).length) {
      const nilai = Object.keys(baharu).length ? { en: baharu } : null;
      const { error: e2 } = await sb.from(jadual).update({ translations: nilai }).eq("id", r.id);
      if (e2) console.error("  ! gagal simpan:", e2.message);
      else ubah++;
    }
  }
  console.log(`${jadual}: ${ubah} rekod dikemas kini, ${buang} medan dibuang.\n`);
}

await tapis("news", { title: "title", body: "body" }, "slug");
await tapis(
  "legacy_records",
  { story: "story", quoteText: "quote_text", result: "result", category: "category", event: "event" },
  "slug",
);
