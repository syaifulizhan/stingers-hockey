import "server-only";
import { createPublicSupabase } from "@/lib/supabase/public";
import { SNAPSHOT, resolveAlias, type LegacyRecord } from "@/lib/legasi";

// ============================================================================
// Bacaan awam Dewan Legasi.
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
  card_front: string | null;
  card_back: string | null;
  published_at: string | null;
};

const COLUMNS =
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
    cardFront: row.card_front,
    cardBack: row.card_back,
    publishedAt: row.published_at,
  };
}

/** Semua rekod tersiar. Jatuh balik ke snapshot bila DB tidak menjawab. */
export async function getPublishedRecords(): Promise<LegacyRecord[]> {
  try {
    const supabase = createPublicSupabase();
    const { data, error } = await supabase
      .from("legacy_records")
      .select(COLUMNS)
      .eq("status", "published")
      .order("cohort", { ascending: false })
      .order("record_no", { ascending: true });

    if (error) throw error;
    if (data && data.length > 0) return (data as unknown as Row[]).map(toRecord);
  } catch (err) {
    console.error("[legasi] DB tidak dapat dibaca, guna snapshot:", err);
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

  try {
    const supabase = createPublicSupabase();
    const { data, error } = await supabase
      .from("legacy_records")
      .select(COLUMNS)
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle();

    if (error) throw error;
    if (data) return toRecord(data as unknown as Row);
  } catch (err) {
    console.error("[legasi] DB tidak dapat dibaca, guna snapshot:", err);
  }

  return SNAPSHOT.find((r) => r.slug === slug) ?? null;
}
