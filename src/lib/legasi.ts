// ============================================================================
// DEWAN LEGASI — alamat kekal dan penolong paparan
//
// Pembahagian yang menjadikan rekod ini bertahan:
//
//   Pangkalan data  → permukaan MENYUNTING. Admin menulis draf, menekan
//                     Terbitkan. RLS menyembunyikan draf daripada awam.
//   Fail snapshot   → permukaan KEKEKALAN. Rekod tersiar dibekukan ke dalam
//                     git oleh `node scripts/beku-legasi.mjs`.
//
// Halaman awam membaca DB dahulu, dan jatuh balik ke snapshot bila DB senyap —
// projek Supabase dijeda, kunci diputar, akaun hilang. Kad fizikal yang
// dicetak hari ini membawa QR ke alamat ini selama-lamanya, jadi rekod itu
// tidak boleh bergantung pada perkhidmatan yang perlu dijaga hidup.
//
// PERATURAN: slug tidak pernah dipadam dan tidak pernah diguna semula.
// ============================================================================

export type { LegacyJourneyStep, LegacyRecord } from "@/lib/legasi-types";
export { SNAPSHOT, SNAPSHOT_AT } from "@/lib/legasi-snapshot";

import type { LegacyRecord } from "@/lib/legasi-types";

/**
 * Slug lama → slug semasa. Hanya bertambah, tidak pernah berkurang.
 * Setiap entri di sini ialah janji kepada sekeping kad yang sudah dicetak.
 */
export const ALIASES: Record<string, string> = {};

/** Alamat kanonik sesuatu rekod — inilah yang dikodkan ke dalam QR. */
export function legacyUrl(slug: string): string {
  return `https://hoki.my/legasi/${slug}`;
}

export function resolveAlias(slug: string): string {
  return ALIASES[slug] ?? slug;
}

/** Kumpulkan rekod ikut tahun, terbaharu dahulu. */
export function byCohort(records: LegacyRecord[]): [number, LegacyRecord[]][] {
  const map = new Map<number, LegacyRecord[]>();
  for (const r of records) {
    const list = map.get(r.cohort) ?? [];
    list.push(r);
    map.set(r.cohort, list);
  }
  return [...map.entries()].sort((a, b) => b[0] - a[0]);
}
