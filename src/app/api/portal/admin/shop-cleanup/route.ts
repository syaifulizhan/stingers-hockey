import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { requireAdminApi } from "@/lib/portal-guard";

// ============================================================================
// PEMBERSIHAN FAIL BUKTI YATIM — bucket 'shop', folder 'proof/'.
//
// Bukti bayaran dimuat naik oleh pelanggan SEBELUM baris tempahan dicipta. Bila
// borang gagal separuh jalan, atau bila tempahan dibuang kekal oleh pg_cron
// (yang tak boleh sentuh Storage), failnya tertinggal selama-lamanya.
//
// "Yatim" bermaksud: tiada satu pun baris shop_orders merujuk fail itu — TERMASUK
// tempahan dalam Tong Sampah. Tempahan yang sudah disahkan memang tiada proof_url
// (bukti dipindah ke Drive), jadi failnya memang patut dibuang dari Storage.
//
// Dua jaring keselamatan:
//   1. Hanya fail dalam 'proof/' disentuh — gambar produk/QR tidak akan tersentuh.
//   2. Fail lebih muda dari MIN_AGE_HOURS dilangkau — melindungi muat naik yang
//      sedang berjalan (fail wujud, baris tempahan belum sempat masuk).
//
// GET  = pratonton sahaja (tiada apa dipadam). POST = padam.
// ============================================================================

const FOLDER = "proof";
const PAGE = 100;
const MAX_SCAN = 5000;
const MIN_AGE_HOURS = 24;
const DELETE_CHUNK = 100;
// PostgREST memulangkan maksimum 1000 baris setiap permintaan. Senarai rujukan
// MESTI lengkap — separuh senarai bermakna fail yang masih dipakai dikira yatim.
const ROW_PAGE = 1000;

type Orphan = { path: string; size: number; created_at: string | null };

// URL awam → laluan dalam bucket. Sepadan dengan cara /api/portal/order/confirm
// menyahkod laluan, supaya perbandingan di sini tidak tersasar.
function urlToPath(url: string): string | null {
  const clean = url.split("?")[0];
  const i = clean.indexOf("/shop/");
  if (i === -1) return null;
  try {
    return decodeURIComponent(clean.slice(i + 6));
  } catch {
    return clean.slice(i + 6);
  }
}

async function findOrphans() {
  const supabase = createSupabaseAdmin();

  // Semua bukti yang MASIH dirujuk — termasuk tempahan dalam Tong Sampah.
  // Dibaca sehingga habis, bukan satu muka surat: senarai rujukan yang tidak
  // lengkap akan menjadikan fail yang masih dipakai kelihatan yatim.
  const referenced = new Set<string>();
  for (let from = 0; ; from += ROW_PAGE) {
    const { data: rows, error: rowsErr } = await supabase
      .from("shop_orders")
      .select("proof_url")
      .not("proof_url", "is", null)
      .range(from, from + ROW_PAGE - 1);
    if (rowsErr) throw new Error(`Gagal baca tempahan: ${rowsErr.message}`);
    for (const r of rows ?? []) {
      const p = urlToPath(String((r as { proof_url: string }).proof_url));
      if (p) referenced.add(p);
    }
    if (!rows || rows.length < ROW_PAGE) break;
  }

  const cutoff = Date.now() - MIN_AGE_HOURS * 3600_000;
  const orphans: Orphan[] = [];
  let scanned = 0;
  let tooNew = 0;
  let capped = false;

  for (let offset = 0; offset < MAX_SCAN; offset += PAGE) {
    const { data: files, error } = await supabase.storage
      .from("shop")
      .list(FOLDER, { limit: PAGE, offset, sortBy: { column: "name", order: "asc" } });
    if (error) throw new Error(`Gagal senarai fail: ${error.message}`);
    if (!files || files.length === 0) break;

    for (const f of files) {
      // Entri tanpa id = subfolder, bukan fail. Nama bermula titik = penanda
      // dalaman Supabase (.emptyFolderPlaceholder). Kedua-duanya jangan sentuh.
      if (!f.id || f.name.startsWith(".")) continue;
      scanned++;
      const path = `${FOLDER}/${f.name}`;
      if (referenced.has(path)) continue;
      const created = f.created_at ?? f.updated_at ?? null;
      if (created && new Date(created).getTime() > cutoff) {
        tooNew++;
        continue;
      }
      orphans.push({
        path,
        size: Number((f.metadata as { size?: number } | null)?.size ?? 0),
        created_at: created,
      });
    }

    if (files.length < PAGE) break;
    if (offset + PAGE >= MAX_SCAN) capped = true;
  }

  return { orphans, scanned, tooNew, capped, referenced: referenced.size };
}

export async function GET() {
  const gate = await requireAdminApi();
  if (!gate.ok) return gate.response;

  try {
    const { orphans, scanned, tooNew, capped, referenced } = await findOrphans();
    return NextResponse.json({
      ok: true,
      scanned,
      referenced,
      capped,
      skippedTooNew: tooNew,
      orphans: orphans.length,
      bytes: orphans.reduce((s, o) => s + o.size, 0),
      sample: orphans.slice(0, 5).map((o) => o.path),
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Gagal semak fail." },
      { status: 500 }
    );
  }
}

export async function POST() {
  const gate = await requireAdminApi();
  if (!gate.ok) return gate.response;

  try {
    // Senarai dikira SEMULA di sini — jangan percaya senarai dari klien, dan
    // jangan padam berdasarkan pratonton yang mungkin sudah basi.
    const { orphans } = await findOrphans();
    if (orphans.length === 0) {
      return NextResponse.json({ ok: true, deleted: 0, bytes: 0 });
    }

    const supabase = createSupabaseAdmin();
    let deleted = 0;
    let bytes = 0;
    for (let i = 0; i < orphans.length; i += DELETE_CHUNK) {
      const chunk = orphans.slice(i, i + DELETE_CHUNK);
      const { error } = await supabase.storage.from("shop").remove(chunk.map((o) => o.path));
      if (error) throw new Error(`Gagal buang fail: ${error.message}`);
      deleted += chunk.length;
      bytes += chunk.reduce((s, o) => s + o.size, 0);
    }

    return NextResponse.json({ ok: true, deleted, bytes });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Gagal buang fail." },
      { status: 500 }
    );
  }
}
