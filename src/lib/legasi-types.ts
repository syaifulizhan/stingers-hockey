// Bentuk data Dewan Legasi. Diasingkan daripada legasi.ts supaya fail
// snapshot yang dijana automatik boleh mengimportnya tanpa kitaran import.

export type LegacyJourneyStep = {
  year: string;
  what: string;
  /** Peringkat kemuncak — dipaparkan dengan aksen amber. */
  peak?: boolean;
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
  publishedAt: string | null;
};
