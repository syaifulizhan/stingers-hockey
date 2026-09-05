import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { beritahuEnjinCarian } from "@/lib/indexnow";
import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase/server";
import { requireCoachApi } from "@/lib/portal-guard";
import { arkibkanSatu } from "@/lib/legasi-arkib";

// ============================================================================
// Hall of Honour — cipta, sunting, terbit.
//
// Draf tidak pernah kelihatan awam: RLS membenarkan kunci awam melihat hanya
// baris berstatus 'published'. Butang Terbitkan di sini ialah SATU-SATUNYA
// jalan sesuatu rekod menjadi awam.
//
// Slug tidak boleh diubah selepas diterbitkan — ia sudah dicetak pada kad.
//
// Rekod TERSIAR boleh disunting bila-bila masa: seorang pemain naik ke
// peringkat lebih tinggi, cerita diperbaiki, gambar ditambah. Setiap versi
// yang pernah tersiar disimpan kekal oleh trigger DB (legacy_versions), jadi
// menyunting tidak pernah memadam sejarah — ia menambah lapisan.
// ============================================================================

// Draf ialah kerja separuh siap — itu maksudnya draf. Jadi baris perjalanan
// yang belum lengkap TIDAK menolak simpanan; ia cuma disaring keluar. Ketat
// hanya berlaku pada saat menerbitkan, di mana ia benar-benar bermakna.
const langkahSchema = z.object({
  year: z.string().trim().default(""),
  what: z.string().trim().default(""),
  peak: z.boolean().optional().default(false),
});

/** Buang baris perjalanan yang langsung kosong. */
function bersihkanJourney(rows: z.infer<typeof langkahSchema>[]) {
  return rows.filter((r) => r.year.trim() !== "" || r.what.trim() !== "");
}

const asasSchema = z.object({
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
      message: "Slug hanya huruf kecil, nombor dan sengkang.",
    }),
  recordNo: z.string().trim().min(1, { message: "Nombor rekod diperlukan." }),
  cohort: z.number().int().min(2000).max(2200),
  fullName: z.string().trim().min(1, { message: "Nama penuh diperlukan." }),
  nameFirst: z.string().trim().default(""),
  nameLast: z.string().trim().default(""),
  result: z.string().trim().optional().or(z.literal("")),
  category: z.string().trim().optional().or(z.literal("")),
  event: z.string().trim().optional().or(z.literal("")),
  school: z.string().trim().optional().or(z.literal("")),
  story: z.string().trim().optional().or(z.literal("")),
  quoteText: z.string().trim().optional().or(z.literal("")),
  quoteBy: z.string().trim().optional().or(z.literal("")),
  journey: z.array(langkahSchema).max(20).optional().default([]),
  photos: z.array(z.string().url()).max(7).optional().default([]),
  heroImage: z.string().url().optional().or(z.literal("")),
  cardFront: z.string().url().optional().or(z.literal("")),
  cardBack: z.string().url().optional().or(z.literal("")),
});

const kemasKiniSchema = asasSchema.partial().extend({
  id: z.string().uuid(),
  status: z.enum(["draft", "published"]).optional(),
});

type Payload = Record<string, unknown>;

function toRow(d: Partial<z.infer<typeof asasSchema>>): Payload {
  const row: Payload = {};
  const set = (k: string, v: unknown) => {
    if (v !== undefined) row[k] = v === "" ? null : v;
  };
  set("slug", d.slug);
  set("record_no", d.recordNo);
  set("cohort", d.cohort);
  set("full_name", d.fullName);
  set("name_first", d.nameFirst);
  set("name_last", d.nameLast);
  set("result", d.result);
  set("category", d.category);
  set("event", d.event);
  set("school", d.school);
  set("story", d.story);
  set("quote_text", d.quoteText);
  set("quote_by", d.quoteBy);
  set("hero_image", d.heroImage);
  set("card_front", d.cardFront);
  set("card_back", d.cardBack);
  if (d.journey !== undefined) row.journey = bersihkanJourney(d.journey);
  if (d.photos !== undefined) row.photos = d.photos;
  return row;
}

function segarkan(slug?: string | null) {
  revalidatePath("/legasi");
  if (slug) revalidatePath(`/legasi/${slug}`);
}

/** Cipta rekod baharu — sentiasa sebagai draf. */
export async function POST(request: Request) {
  const gate = await requireCoachApi();
  if (!gate.ok) return gate.response;

  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Sila log masuk." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Permintaan tidak sah." }, { status: 400 });
  }

  const parsed = asasSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, errors: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("legacy_records")
    .insert({ ...toRow(parsed.data), status: "draft", created_by: userId })
    .select("id, slug, status")
    .single();

  if (error) {
    const dup = error.code === "23505";
    return NextResponse.json(
      {
        ok: false,
        error: dup
          ? "Slug atau nombor rekod itu sudah digunakan. Kedua-duanya mesti unik dan kekal."
          : "Gagal menyimpan rekod.",
      },
      { status: dup ? 409 : 500 },
    );
  }

  return NextResponse.json({ ok: true, record: data });
}

/** Kemas kini draf, atau tukar status (terbit / tarik balik ke draf). */
export async function PATCH(request: Request) {
  const gate = await requireCoachApi();
  if (!gate.ok) return gate.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Permintaan tidak sah." }, { status: 400 });
  }

  const parsed = kemasKiniSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, errors: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  const { id, status, ...fields } = parsed.data;
  const supabase = await createServerSupabase();

  const { data: sedia } = await supabase
    .from("legacy_records")
    .select("slug, status, published_at")
    .eq("id", id)
    .maybeSingle();

  if (!sedia) {
    return NextResponse.json({ ok: false, error: "Rekod tidak dijumpai." }, { status: 404 });
  }

  // Slug sesuatu rekod yang SUDAH tersiar tidak boleh ditukar di sini: QR yang
  // dicetak menunjuk kepadanya. Perpindahan slug perlu entri alias, yang
  // sengaja dijadikan langkah sedar dan berasingan.
  if (
    fields.slug &&
    fields.slug !== sedia.slug &&
    sedia.status === "published"
  ) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Rekod ini sudah tersiar, jadi slugnya tidak boleh ditukar — kod QR yang dicetak menunjuk kepadanya.",
      },
      { status: 409 },
    );
  }

  // Ketat hanya di sini: sesuatu yang menjadi rekod kekal patut lengkap.
  if (status === "published") {
    const langkah = bersihkanJourney(fields.journey ?? []);
    const cacat = langkah.find((l) => !l.year.trim() || !l.what.trim());
    if (cacat) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Setiap langkah perjalanan perlu tahun dan keterangan sebelum boleh diterbitkan. Buang baris yang tidak digunakan.",
        },
        { status: 422 },
      );
    }
  }

  const row = toRow(fields);
  if (status) {
    row.status = status;
    // Cap masa pertama kali tersiar dikekalkan — "direkodkan pada" tidak
    // sepatutnya berubah setiap kali admin menyunting semula.
    if (status === "published" && !sedia.published_at) row.published_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from("legacy_records")
    .update(row)
    .eq("id", id)
    .select("id, slug, status")
    .single();

  if (error) {
    const dup = error.code === "23505";
    return NextResponse.json(
      {
        ok: false,
        error: dup ? "Slug atau nombor rekod itu sudah digunakan." : "Gagal mengemas kini rekod.",
      },
      { status: dup ? 409 : 500 },
    );
  }

  segarkan(sedia.slug);
  if (data?.slug && data.slug !== sedia.slug) segarkan(data.slug);

  // Hantar salinan ke Internet Archive setiap kali sesuatu menjadi tersiar
  // atau rekod tersiar disunting. Kegagalan arkib tidak menjejaskan
  // penerbitan — cron harian akan mencuba lagi.
  const kiniTersiar = (status ?? sedia.status) === "published";
  if (kiniTersiar && data?.slug) {
    // Rekod Hall of Honour membawa nama penuh seorang pemain — itulah yang
    // orang taip ke dalam Google. Kad fizikal dengan QR diserahkan pada hari
    // rekod itu terbit, jadi alamat ini patut boleh dicari pada hari itu juga.
    beritahuEnjinCarian(["/legasi", `/legasi/${data.slug}`]);
  }

  let arkib: { ok: boolean; archiveUrl?: string } | null = null;
  if (kiniTersiar && data?.slug) {
    const h = await arkibkanSatu(data.slug, 12_000);
    arkib = { ok: h.ok, archiveUrl: h.archiveUrl };
    if (h.ok) {
      await supabase
        .from("legacy_records")
        .update({ archived_at: new Date().toISOString(), archive_url: h.archiveUrl })
        .eq("id", id);
    }
  }

  return NextResponse.json({ ok: true, record: data, arkib });
}

/** Padam — hanya draf. Rekod tersiar ialah rekod kekal. */
export async function DELETE(request: Request) {
  const gate = await requireCoachApi();
  if (!gate.ok) return gate.response;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ ok: false, error: "id diperlukan." }, { status: 400 });
  }

  const supabase = await createServerSupabase();
  const { data: sedia } = await supabase
    .from("legacy_records")
    .select("status")
    .eq("id", id)
    .maybeSingle();

  if (!sedia) {
    return NextResponse.json({ ok: false, error: "Rekod tidak dijumpai." }, { status: 404 });
  }
  if (sedia.status === "published") {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Rekod yang sudah tersiar tidak boleh dipadam. Tarik balik ke draf dahulu jika benar-benar perlu.",
      },
      { status: 409 },
    );
  }

  const { error } = await supabase.from("legacy_records").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ ok: false, error: "Gagal memadam rekod." }, { status: 500 });
  }

  segarkan();
  return NextResponse.json({ ok: true });
}
