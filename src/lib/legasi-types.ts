// Bentuk data Hall of Honour. Diasingkan daripada legasi.ts supaya fail
// snapshot yang dijana automatik boleh mengimportnya tanpa kitaran import.

import type { LegacyTier } from "@/lib/legasi-tier";

export type LegacyJourneyStep = {
  year: string;
  what: string;
  /** Peringkat kemuncak — dipaparkan dengan aksen amber. */
  peak?: boolean;
};

/** Satu versi yang pernah tersiar. Sejarah ini tidak pernah dipadam. */
export type LegacyRevision = {
  versionNo: number;
  capturedAt: string;
};

export type LegacyRecord = {
  slug: string;
  recordNo: string;
  cohort: number;
  fullName: string;
  /** Nama dipecah dua baris pada paparan besar, mengikut kad fizikal. */
  nameFirst: string;
  nameLast: string;
  result: string | null;
  category: string | null;
  event: string | null;
  school: string | null;
  story: string | null;
  quoteText: string | null;
  quoteBy: string | null;
  journey: LegacyJourneyStep[];
  photos: string[];
  heroImage: string | null;
  cardFront: string | null;
  cardBack: string | null;
  /**
   * Setinggi mana nama ini dibawa. Null bermakna belum ditetapkan — rekod itu
   * kekal dengan rupa amber asalnya sehingga admin memilih peringkatnya.
   *
   * OPSYENAL dengan sengaja. Fail snapshot beku ialah artifak kekal: salinan
   * yang ditulis sebelum lajur ini wujud mesti terus menaip-semak selamanya,
   * jika tidak keseluruhan jaringan keselamatan runtuh apabila skema
   * berkembang.
   */
  tier?: LegacyTier | null;
  publishedAt: string | null;
  /** Setiap versi yang pernah tersiar, terbaharu dahulu. */
  revisions: LegacyRevision[];
  /** Bila alamat ini terakhir dihantar ke Internet Archive. */
  archivedAt: string | null;
  archiveUrl: string | null;
};
