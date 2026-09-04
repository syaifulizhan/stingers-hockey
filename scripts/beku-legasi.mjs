#!/usr/bin/env node
/**
 * Bekukan rekod Hall of Honour yang sudah tersiar ke dalam repo.
 *
 * Inilah langkah yang menjadikan rekod itu kekal. Pangkalan data ialah tempat
 * admin menyunting; fail yang dijana di sini ialah salinan yang hidup dalam
 * git dan tidak boleh dijeda, diputar kuncinya, atau hilang bersama akaun.
 *
 * Jalankan selepas menerbitkan sesuatu rekod, kemudian komit hasilnya:
 *   node scripts/beku-legasi.mjs
 *   git add src/lib/legasi-snapshot.ts && git commit
 *
 * Membaca NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY dari
 * .env.local. Kunci awam memadai — ia hanya nampak baris 'published', iaitu
 * tepat apa yang patut dibekukan.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "node:fs";

const OUT = "src/lib/legasi-snapshot.ts";

function envDariFail() {
  const env = {};
  try {
    for (const baris of readFileSync(".env.local", "utf8").split("\n")) {
      const m = baris.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch {
    /* tiada .env.local — bergantung pada env proses */
  }
  return env;
}

const env = { ...envDariFail(), ...process.env };
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error("✗ NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY tidak dijumpai.");
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

const { data, error } = await supabase
  .from("legacy_records")
  .select(
    "slug, record_no, cohort, full_name, name_first, name_last, result, category, event, " +
      "school, story, quote_text, quote_by, journey, photos, hero_image, card_front, " +
      "card_back, published_at, archived_at, archive_url, " +
      "legacy_versions(version_no, captured_at)",
  )
  .eq("status", "published")
  .order("cohort", { ascending: false })
  .order("record_no", { ascending: true });

if (error) {
  console.error("✗ Gagal membaca legacy_records:", error.message);
  if (/legacy_versions|archived_at|archive_url/.test(error.message)) {
    console.error(
      "  Nampaknya migrasi 20260905_legasi_versi_arkib.sql belum dijalankan.",
    );
  }
  process.exit(1);
}

const records = (data ?? []).map((r) => ({
  slug: r.slug,
  recordNo: r.record_no,
  cohort: r.cohort,
  fullName: r.full_name,
  nameFirst: r.name_first || r.full_name,
  nameLast: r.name_last || "",
  result: r.result ?? null,
  category: r.category ?? null,
  event: r.event ?? null,
  school: r.school ?? null,
  story: r.story ?? null,
  quoteText: r.quote_text ?? null,
  quoteBy: r.quote_by ?? null,
  journey: Array.isArray(r.journey) ? r.journey : [],
  photos: Array.isArray(r.photos) ? r.photos : [],
  heroImage: r.hero_image ?? null,
  cardFront: r.card_front ?? null,
  cardBack: r.card_back ?? null,
  publishedAt: r.published_at ?? null,
  // Sejarah versi dibekukan bersama rekod. Setiap kali skrip ini dijalankan
  // dan hasilnya dikomit, git sendiri menjadi lapisan sejarah kedua.
  revisions: (r.legacy_versions ?? [])
    .map((v) => ({ versionNo: v.version_no, capturedAt: v.captured_at }))
    .sort((a, b) => b.versionNo - a.versionNo),
  archivedAt: r.archived_at ?? null,
  archiveUrl: r.archive_url ?? null,
}));

// Snapshot kosong hampir pasti bermakna DB tidak dapat dihubungi atau migrasi
// belum dijalankan — bukan "semua rekod telah dipadam". Menulisnya akan
// MEMADAM salinan kekal yang sedia ada dalam git, jadi ia ditolak.
const sedia = readFileSync(OUT, "utf8");
const adaIsiSebelumIni = /slug:\s*"/.test(sedia);
if (records.length === 0 && adaIsiSebelumIni) {
  console.error(
    "✗ DB memulangkan sifar rekod tersiar sedangkan snapshot sedia ada tidak kosong.\n" +
      "  Ini menolak untuk menulis, kerana ia akan memadam salinan kekal.\n" +
      "  Kalau memang niatnya menarik semua rekod, kosongkan fail itu secara manual.",
  );
  process.exit(1);
}

const isi = `// DIJANA AUTOMATIK — jangan sunting tangan.
// Jalankan: node scripts/beku-legasi.mjs
//
// Salinan beku setiap rekod yang SUDAH diterbitkan. Ini yang menyelamatkan
// Hall of Honour bila pangkalan data tidak lagi menjawab.
import type { LegacyRecord } from "@/lib/legasi-types";

export const SNAPSHOT: LegacyRecord[] = ${JSON.stringify(records, null, 2)};

/** Cap masa fail ini dijana terakhir. */
export const SNAPSHOT_AT: string | null = ${JSON.stringify(new Date().toISOString())};
`;

writeFileSync(OUT, isi);

console.log(`✓ ${records.length} rekod tersiar dibekukan ke ${OUT}`);
for (const r of records) {
  const versi = r.revisions.length ? `  v${r.revisions[0].versionNo}` : "";
  console.log(`   ${r.recordNo}  ${r.fullName}  →  /legasi/${r.slug}${versi}`);
}
if (records.length === 0) {
  console.log("   (belum ada rekod tersiar — jalankan semula selepas menekan Terbitkan)");
}
