#!/usr/bin/env node
/**
 * Hantar setiap alamat Hall of Honour ke Internet Archive.
 *
 * Cron harian sudah melakukan ini secara automatik (lihat
 * src/app/api/cron/keep-alive/route.ts). Skrip ini untuk menjalankannya
 * segera dengan tangan — selepas menerbitkan rekod, atau untuk mengesahkan
 * jaring arkib itu benar-benar berfungsi.
 *
 * Jalankan: node scripts/arkib-legasi.mjs [slug ...]
 * Tanpa argumen, ia mengarkibkan semua rekod tersiar.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

function envDariFail() {
  const env = {};
  try {
    for (const baris of readFileSync(".env.local", "utf8").split("\n")) {
      const m = baris.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch {
    /* tiada .env.local */
  }
  return env;
}

const env = { ...envDariFail(), ...process.env };
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let slugs = process.argv.slice(2);

if (slugs.length === 0) {
  if (!url || !key) {
    console.error("✗ Env Supabase tidak dijumpai, dan tiada slug diberi.");
    console.error("  Guna: node scripts/arkib-legasi.mjs <slug> [slug ...]");
    process.exit(1);
  }
  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const { data, error } = await supabase
    .from("legacy_records")
    .select("slug")
    .eq("status", "published");

  if (error) {
    console.error("✗ Gagal membaca rekod:", error.message);
    process.exit(1);
  }
  slugs = (data ?? []).map((r) => r.slug);
}

if (slugs.length === 0) {
  console.log("Tiada rekod tersiar untuk diarkibkan.");
  process.exit(0);
}

console.log(`Menghantar ${slugs.length} alamat ke Internet Archive...\n`);

let berjaya = 0;
for (const slug of slugs) {
  const alamat = `https://hoki.my/legasi/${slug}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 60_000);
  try {
    // `manual`: URL snapshot bertarikh datang dalam header `location` pada 302.
    const res = await fetch(`https://web.archive.org/save/${alamat}`, {
      redirect: "manual",
      signal: controller.signal,
      headers: { "User-Agent": "stingers-hockey-legasi-archiver/1.0 (+https://hoki.my)" },
    });
    const lokasi = res.headers.get("location");
    if (lokasi && lokasi.includes("/web/")) {
      berjaya++;
      console.log(`  ✓ ${slug}\n      ${lokasi}`);
    } else if (res.ok || res.status === 302) {
      berjaya++;
      console.log(`  ✓ ${slug} (disimpan, cap masa tidak dikembalikan)`);
    } else {
      console.log(`  ✗ ${slug} — Wayback membalas ${res.status}`);
    }
  } catch (err) {
    console.log(`  ✗ ${slug} — ${err instanceof Error ? err.message : err}`);
  } finally {
    clearTimeout(timer);
  }
}

console.log(`\n${berjaya}/${slugs.length} berjaya.`);
console.log("Semak: https://web.archive.org/web/*/hoki.my/legasi/*");
