// DIJANA AUTOMATIK — jangan sunting tangan.
// Jalankan: node scripts/beku-legasi.mjs
//
// Salinan beku setiap rekod yang SUDAH diterbitkan. Ini yang menyelamatkan
// Dewan Legasi bila pangkalan data tidak lagi menjawab.
import type { LegacyRecord } from "@/lib/legasi-types";

export const SNAPSHOT: LegacyRecord[] = [];

/** Cap masa fail ini dijana terakhir. */
export const SNAPSHOT_AT: string | null = null;
