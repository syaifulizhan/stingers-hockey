import "server-only";
import { createPublicSupabase } from "@/lib/supabase/public";
import { SNAPSHOT, resolveAlias, type LegacyRecord } from "@/lib/legasi";

// ============================================================================
// Bacaan awam Hall of Honour.
//
// Rantaian: DB (hanya status 'published', dikuatkuasa RLS) → snapshot beku.
// Draf TIDAK PERNAH sampai ke sini: kunci awam tidak dapat melihatnya, jadi
// halaman awam tidak boleh terbocor walaupun ada pepijat di lapisan paparan.
// ============================================================================

type Row = {
  slug: string;
  record_no: string;
  cohort: number;
  full_name: string;
  name_first: string | null;
  name_last: string | null;
  result: string | null;
  category: string | null;
  event: string | null;
  school: string | null;
  story: string | null;
  quote_text: string | null;
  quote_by: string | null;
  journey: unknown;
  photos: unknown;
  hero_image: string | null;
  tier?: string | null;
  card_front: string | null;
  card_back: string | null;
  published_at: string | null;
  archived_at?: string | null;
  archive_url?: string | null;
  legacy_versions?: { version_no: number; captured_at: string }[] | null;
};

const COLUMNS =
  "slug, record_no, cohort, full_name, name_first, name_last, result, category, " +
  "event, school, story, quote_text, quote_by, journey, photos, hero_image, " +
  "tier, card_front, card_back, published_at, archived_at, archive_url, " +
  // Sejarah setiap versi yang pernah tersiar — dibaca bersama rekod supaya
  // halaman boleh menunjukkan bahawa rekod ini hidup dan berkembang.
  "legacy_versions(version_no, captured_at)";

// Set lajur tanpa versi/arkib, untuk DB yang belum menjalankan migrasi kedua.
const COLUMNS_ASAS =
  "slug, record_no, cohort, full_name, name_first, name_last, result, category, " +
  "event, school, story, quote_text, quote_by, journey, photos, hero_image, " +
  "card_front, card_back, published_at";

function toRecord(row: Row): LegacyRecord {
  return {
    slug: row.slug,
    recordNo: row.record_no,
    cohort: row.cohort,
    fullName: row.full_name,
    nameFirst: row.name_first || row.full_name,
    nameLast: row.name_last || "",
    result: row.result,
    category: row.category,
    event: row.event,
    school: row.school,
    story: row.story,
    quoteText: row.quote_text,
    quoteBy: row.quote_by,
    journey: Array.isArray(row.journey) ? (row.journey as LegacyRecord["journey"]) : [],
    photos: Array.isArray(row.photos) ? (row.photos as string[]) : [],
    heroImage: row.hero_image,
    // Lajur `tier` mungkin belum wujud (COLUMNS_ASAS tidak memintanya), dan
    // rekod snapshot lama tidak membawanya. Kedua-duanya bermakna null.
    tier: (row.tier as LegacyRecord["tier"]) ?? null,
    cardFront: row.card_front,
    cardBack: row.card_back,
    publishedAt: row.published_at,
    revisions: (row.legacy_versions ?? [])
      .map((v) => ({ versionNo: v.version_no, capturedAt: v.captured_at }))
      .sort((a, b) => b.versionNo - a.versionNo),
    archivedAt: row.archived_at ?? null,
    archiveUrl: row.archive_url ?? null,
  };
}

/** Semua rekod tersiar. Jatuh balik ke snapshot bila DB tidak menjawab. */
export async function getPublishedRecords(): Promise<LegacyRecord[]> {
  const supabase = createPublicSupabase();

  // Cuba dengan versi + arkib; jika migrasi kedua belum dijalankan, cuba
  // tanpa. Halaman tidak sepatutnya gelap hanya kerana satu lajur belum ada.
  for (const cols of [COLUMNS, COLUMNS_ASAS]) {
    try {
      const { data, error } = await supabase
        .from("legacy_records")
        .select(cols)
        .eq("status", "published")
        .order("cohort", { ascending: false })
        .order("record_no", { ascending: true });

      if (error) throw error;
      if (data && data.length > 0) return (data as unknown as Row[]).map(toRecord);
      return SNAPSHOT.length > 0 ? SNAPSHOT : [];
    } catch (err) {
      if (cols === COLUMNS_ASAS) {
        console.error("[legasi] DB tidak dapat dibaca, guna snapshot:", err);
      }
    }
  }
  return SNAPSHOT;
}

/**
 * Satu rekod ikut slug (alias lama diterima).
 * Memulangkan null hanya jika rekod itu benar-benar tiada di kedua-dua tempat —
 * pemanggil BERTANGGUNGJAWAB memaparkan halaman bermaruah, bukan 404.
 */
export async function getRecordBySlug(rawSlug: string): Promise<LegacyRecord | null> {
  const slug = resolveAlias(rawSlug);

  const supabase = createPublicSupabase();

  for (const cols of [COLUMNS, COLUMNS_ASAS]) {
    try {
      const { data, error } = await supabase
        .from("legacy_records")
        .select(cols)
        .eq("slug", slug)
        .eq("status", "published")
        .maybeSingle();

      if (error) throw error;
      if (data) return toRecord(data as unknown as Row);
      break;
    } catch (err) {
      if (cols === COLUMNS_ASAS) {
        console.error("[legasi] DB tidak dapat dibaca, guna snapshot:", err);
      }
    }
  }

  return SNAPSHOT.find((r) => r.slug === slug) ?? null;
}
