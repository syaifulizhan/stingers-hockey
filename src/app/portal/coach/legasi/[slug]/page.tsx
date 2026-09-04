import Link from "next/link";
import { ArrowLeft, Eye } from "lucide-react";
import { createServerSupabase } from "@/lib/supabase/server";
import { requireCoachPage } from "@/lib/portal-guard";
import ProfilLegasiView from "@/components/legasi/ProfilLegasiView";
import type { LegacyRecord } from "@/lib/legasi-types";

// ============================================================================
// Pratonton draf Hall of Honour.
//
// Ia merender komponen AWAM yang sebenar (ProfilLegasiView), bukan salinan.
// Itu penting: pratonton yang dibina daripada komponen berasingan akan
// menyimpang dari halaman sebenar dari masa ke masa, dan pratonton yang
// menipu lebih teruk daripada tiada pratonton.
//
// Data dibaca dengan token Clerk pengguna, jadi RLS yang membenarkan draf
// dilihat — bukan penapisan di sini.
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
  journey: { year: string; what: string; peak?: boolean }[] | null;
  photos: string[] | null;
  hero_image: string | null;
  card_front: string | null;
  card_back: string | null;
  status: "draft" | "published";
  published_at: string | null;
  archived_at: string | null;
  archive_url: string | null;
  legacy_versions: { version_no: number; captured_at: string }[] | null;
};

export default async function PratontonLegasiPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  // GATE ALLOWLIST — draf tidak boleh dilihat sesiapa di luar portal.
  await requireCoachPage();

  const { slug } = await params;
  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from("legacy_records")
    .select(
      "slug, record_no, cohort, full_name, name_first, name_last, result, category, event, " +
        "school, story, quote_text, quote_by, journey, photos, hero_image, card_front, " +
        "card_back, status, published_at, archived_at, archive_url, " +
        "legacy_versions(version_no, captured_at)",
    )
    .eq("slug", slug)
    .maybeSingle();

  const row = data as unknown as Row | null;

  if (!row) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16">
        <Link
          href="/portal/coach"
          className="inline-flex items-center gap-1.5 font-sans text-sm text-muted hover:text-amber"
        >
          <ArrowLeft className="h-4 w-4" /> Kembali ke portal
        </Link>
        <h1 className="display mt-6 text-3xl text-paper">Rekod tidak dijumpai</h1>
        <p className="mt-2 font-sans text-sm text-muted">
          Tiada rekod dengan slug <code className="text-amber">{slug}</code>.
        </p>
      </div>
    );
  }

  const record: LegacyRecord = {
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
    journey: row.journey ?? [],
    photos: row.photos ?? [],
    heroImage: row.hero_image,
    cardFront: row.card_front,
    cardBack: row.card_back,
    // Draf belum pernah tersiar — tunjuk tarikh hari ini supaya susun atur
    // footer kelihatan seperti sebenar, bukan kosong.
    publishedAt: row.published_at ?? new Date().toISOString(),
    revisions: (row.legacy_versions ?? [])
      .map((v) => ({ versionNo: v.version_no, capturedAt: v.captured_at }))
      .sort((a, b) => b.versionNo - a.versionNo),
    archivedAt: row.archived_at,
    archiveUrl: row.archive_url,
  };

  const draf = row.status === "draft";

  return (
    <>
      {/* Pita pratonton — mesti mustahil disalah anggap sebagai halaman sebenar. */}
      <div
        className={`sticky top-0 z-50 border-b px-6 py-3 ${
          draf ? "border-amber/40 bg-amber/15" : "border-line bg-bg-soft"
        }`}
      >
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-2">
          <span className="inline-flex items-center gap-1.5 font-sans text-xs font-semibold uppercase tracking-widest text-amber">
            <Eye className="h-3.5 w-3.5" />
            Pratonton
          </span>
          <span className="font-sans text-xs text-muted">
            {draf
              ? "Ini draf. Belum kelihatan oleh sesiapa di luar portal."
              : "Rekod ini sudah tersiar — inilah yang orang awam nampak."}
          </span>
          <div className="ml-auto flex items-center gap-4">
            <Link
              href="/portal/coach"
              className="font-sans text-xs text-muted underline-offset-2 hover:text-amber hover:underline"
            >
              ← Kembali menyunting
            </Link>
            {!draf && (
              <Link
                href={`/legasi/${row.slug}`}
                target="_blank"
                className="font-sans text-xs text-amber underline-offset-2 hover:underline"
              >
                Buka halaman sebenar
              </Link>
            )}
          </div>
        </div>
      </div>

      <ProfilLegasiView r={record} />
    </>
  );
}
