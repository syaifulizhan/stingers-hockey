import "server-only";
import { revalidatePath } from "next/cache";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { terjemahBerita, terjemahLegasi } from "@/lib/terjemah-rekod";

// ============================================================================
// BAKI TERJEMAHAN — sembuh sendiri apabila kuota kembali.
//
// Terjemahan berlaku semasa terbit, tetapi kuota harian MyMemory boleh habis
// pada saat itu juga. Bila itu berlaku, medan itu tidak disimpan dan halaman
// memaparkan bahasa Melayu — betul, tetapi ia akan kekal begitu selamanya
// kerana tiada apa yang akan cuba lagi.
//
// Fungsi ini ialah percubaan semula itu. Ia berjalan bersama cron harian,
// mencari kandungan tersiar yang masih kekurangan bahasa Inggerisnya, dan
// menghabiskan bakinya sedikit demi sedikit. Bila kuota habis lagi, larian
// esok menyambung dari tempat ia berhenti.
//
// DUA PERATURAN YANG MENJAGA KUOTA:
//
//   1. Rekod yang SUDAH mempunyai terjemahan lengkap tidak pernah disentuh.
//      Terjemahan disimpan kekal; membakar kuota untuk menterjemah semula
//      teks yang sama ialah pembaziran yang paling mudah dielakkan.
//
//   2. Setiap larian mempunyai bajet. Menterjemah semuanya sekali gus
//      menghabiskan kuota sehari dan melebihi had masa fungsi. Beberapa
//      rekod sehari menghabiskan baki dalam beberapa hari tanpa
//      menyentuh siling.
// ============================================================================

/** Bilangan rekod paling banyak disentuh dalam satu larian cron. */
const BAJET = 3;

type Hasil = {
  diperiksa: number;
  diterjemah: number;
  gagal: number;
  baki: number;
  butiran: string[];
};

/** Adakah blok terjemahan ini lengkap untuk medan yang ada isinya? */
function lengkap(
  translations: { en?: Record<string, string> } | null,
  perlu: Record<string, string | null | undefined>,
): boolean {
  const en = translations?.en ?? {};
  return Object.entries(perlu).every(([kunci, nilai]) => {
    // Medan kosong dalam bahasa Melayu tidak memerlukan versi Inggeris.
    if (!nilai || !nilai.trim()) return true;
    return Boolean(en[kunci]?.trim());
  });
}

export async function habiskanBakiTerjemahan(): Promise<Hasil> {
  const sb = createSupabaseAdmin();
  const butiran: string[] = [];
  let diterjemah = 0;
  let gagal = 0;
  let bajet = BAJET;

  // ── Berita ────────────────────────────────────────────────────────────
  const { data: berita } = await sb
    .from("news")
    .select("id, slug, title, body, translations")
    .order("published_at", { ascending: false });

  const beritaBaki = (berita ?? []).filter(
    (n) => !lengkap(n.translations as never, { title: n.title as string, body: n.body as string | null }),
  );

  for (const n of beritaBaki) {
    if (bajet <= 0) break;
    bajet--;
    const t = await terjemahBerita({ title: n.title as string, body: (n.body as string | null) ?? null });
    if (!t) {
      gagal++;
      butiran.push(`berita ${n.slug}: tiada hasil (kemungkinan kuota)`);
      // Kuota habis menjejaskan semua yang seterusnya juga, jadi berhenti
      // di sini dan biarkan larian esok menyambung.
      break;
    }
    // Gabung dengan yang sedia ada supaya medan yang sudah baik kekal.
    const sedia = ((n.translations as { en?: Record<string, string> } | null)?.en) ?? {};
    const { error } = await sb
      .from("news")
      .update({ translations: { en: { ...sedia, ...(t.en ?? {}) } } })
      .eq("id", n.id);
    if (error) {
      gagal++;
      butiran.push(`berita ${n.slug}: gagal simpan`);
      continue;
    }
    diterjemah++;
    butiran.push(`berita ${n.slug}: siap`);
  }

  // ── Hall of Honour ────────────────────────────────────────────────────
  const { data: legasi } = await sb
    .from("legacy_records")
    .select(
      "id, slug, full_name, name_first, name_last, story, quote_text, quote_by, result, category, event, translations",
    )
    .eq("status", "published");

  const legasiBaki = (legasi ?? []).filter(
    (r) =>
      !lengkap(r.translations as never, {
        story: r.story as string | null,
        quoteText: r.quote_text as string | null,
        result: r.result as string | null,
        category: r.category as string | null,
        event: r.event as string | null,
      }),
  );

  for (const r of legasiBaki) {
    if (bajet <= 0) break;
    bajet--;
    const t = await terjemahLegasi({
      fullName: r.full_name as string | null,
      nameFirst: r.name_first as string | null,
      nameLast: r.name_last as string | null,
      story: r.story as string | null,
      quoteText: r.quote_text as string | null,
      quoteBy: r.quote_by as string | null,
      result: r.result as string | null,
      category: r.category as string | null,
      event: r.event as string | null,
    });
    if (!t) {
      gagal++;
      butiran.push(`legasi ${r.slug}: tiada hasil (kemungkinan kuota)`);
      break;
    }
    const sedia = ((r.translations as { en?: Record<string, string> } | null)?.en) ?? {};
    const { error } = await sb
      .from("legacy_records")
      .update({ translations: { en: { ...sedia, ...(t.en ?? {}) } } })
      .eq("id", r.id);
    if (error) {
      gagal++;
      butiran.push(`legasi ${r.slug}: gagal simpan`);
      continue;
    }
    diterjemah++;
    butiran.push(`legasi ${r.slug}: siap`);
  }

  if (diterjemah > 0) {
    revalidatePath("/");
    revalidatePath("/berita");
    revalidatePath("/legasi");
  }

  const baki = beritaBaki.length + legasiBaki.length - diterjemah;
  return {
    diperiksa: (berita?.length ?? 0) + (legasi?.length ?? 0),
    diterjemah,
    gagal,
    baki: Math.max(baki, 0),
    butiran,
  };
}
