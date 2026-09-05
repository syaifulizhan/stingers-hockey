import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase/server";
import { sendPush } from "@/lib/push";
import { makeSlug } from "@/lib/slug";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireCoachApi } from "@/lib/portal-guard";
import { beritahuEnjinCarian } from "@/lib/indexnow";
import { simpanTerjemahanBerita } from "@/lib/simpan-terjemahan";

// Pastikan slug unik (tambah -2, -3, … jika bertindih).
async function uniqueSlug(supabase: SupabaseClient, base: string): Promise<string> {
  let slug = base;
  for (let i = 2; i <= 50; i++) {
    const { data } = await supabase.from("news").select("id").eq("slug", slug).maybeSingle();
    if (!data) return slug;
    slug = `${base}-${i}`;
  }
  return `${base}-${Date.now()}`;
}

// Coach post berita. RLS (news_write = is_coach) menguatkuasakan kebenaran.
const schema = z.object({
  title: z.string().trim().min(1, { message: "Tajuk diperlukan." }),
  body: z.string().trim().optional().or(z.literal("")),
  // Sehingga 5 URL gambar; yang pertama ialah gambar utama.
  imageUrls: z.array(z.string().url()).max(5).optional().default([]),
});

export async function POST(request: Request) {
  // GATE ALLOWLIST — akaun mesti diluluskan admin sebelum apa-apa data disentuh.
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

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, errors: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const imageUrls = parsed.data.imageUrls ?? [];
  const mainImageUrl = imageUrls[0] ?? null;

  const supabase = await createServerSupabase();
  const slug = await uniqueSlug(supabase, makeSlug(parsed.data.title));

  // Bina payload tanpa image_urls jika tiada gambar — elak ralat kolum
  // "does not exist" pada DB yang belum dimigrasi.
  const insertPayload: Record<string, unknown> = {
    title: parsed.data.title,
    body: parsed.data.body || null,
    image_url: mainImageUrl,
    author: userId,
    slug,
  };
  if (imageUrls.length > 0) {
    insertPayload.image_urls = imageUrls;
  }

  let { data, error } = await supabase
    .from("news")
    .insert(insertPayload)
    .select("id")
    .maybeSingle();

  // Jika kolum image_urls belum wujud dalam DB, cuba semula tanpa galeri.
  if (error && (error.code === "42703" || error.code === "PGRST204") && insertPayload.image_urls) {
    console.warn("[coach/news] image_urls column missing, retrying without gallery");
    const { image_urls: _dropped, ...fallbackPayload } = insertPayload;
    const retry = await supabase.from("news").insert(fallbackPayload).select("id").maybeSingle();
    data = retry.data;
    error = retry.error;
  }

  if (error) {
    console.error("[coach/news] INSERT gagal:", error.code, error.message);
    const msg =
      error.code === "42501"
        ? "Anda tiada kebenaran untuk post berita."
        : `Gagal post berita. (${error.message})`;
    return NextResponse.json({ ok: false, error: msg }, { status: 403 });
  }

  // Notifikasi broadcast kepada semua ahli.
  const link = data?.id ? `/portal/news/${data.id}` : "/portal/dashboard";
  await supabase.from("notifications").insert({
    user_id: null,
    title: `Berita baharu: ${parsed.data.title}`,
    link,
    ref_type: "news",
    ref_id: data?.id ?? null,
  });

  // Push notification ke semua telefon yang melanggan.
  await sendPush(supabase, {
    userIds: null,
    title: "Berita baharu — Stingers Hockey",
    body: parsed.data.title,
    url: link,
  });

  // Invalidate cache laman utama & arkib berita supaya berita baharu terus muncul.
  revalidatePath("/");
  revalidatePath("/berita");

  // Enjin carian diberitahu serta-merta, bukan menunggu cron harian. Artikel
  // berita bernilai pada hari ia terbit; diindeks tiga hari kemudian bermakna
  // terlepas keseluruhan tempoh orang mencarinya.
  beritahuEnjinCarian(["/", "/berita", `/berita/${slug}`]);
  // Terjemahan berjalan SELEPAS balasan, seperti IndexNow. Ia mengambil
  // beberapa saat untuk artikel panjang, dan jurulatih tidak sepatutnya
  // menunggu mesin terjemahan sebelum melihat beritanya tersiar.
  if (data?.id) {
    simpanTerjemahanBerita(data.id, { title: parsed.data.title, body: parsed.data.body || null });
  }

  return NextResponse.json({ ok: true });
}

// Edit berita (tajuk + isi).
const editSchema = z.object({
  id: z.string().uuid(),
  title: z.string().trim().min(1, { message: "Tajuk diperlukan." }),
  body: z.string().trim().optional().or(z.literal("")),
});

export async function PATCH(request: Request) {
  // GATE ALLOWLIST — akaun mesti diluluskan admin sebelum apa-apa data disentuh.
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
  const parsed = editSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Data tidak sah." }, { status: 422 });
  }
  const supabase = await createServerSupabase();
  // Slug dipulangkan supaya alamat artikel yang disunting boleh dihantar
  // semula ke IndexNow — teks yang diperbetulkan tidak berguna jika enjin
  // carian masih memaparkan versi lama.
  const { data: updated, error } = await supabase
    .from("news")
    .update({ title: parsed.data.title, body: parsed.data.body || null })
    .eq("id", parsed.data.id)
    .select("slug")
    .maybeSingle();
  if (error) {
    console.error("[coach/news] edit gagal:", error.message);
    return NextResponse.json({ ok: false, error: "Gagal kemas kini berita." }, { status: 403 });
  }
  revalidatePath("/");
  revalidatePath("/berita");
  const slugDisunting = (updated as { slug?: string | null } | null)?.slug;
  if (slugDisunting) revalidatePath(`/berita/${slugDisunting}`);
  beritahuEnjinCarian(
    slugDisunting ? ["/", "/berita", `/berita/${slugDisunting}`] : ["/", "/berita"]
  );
  // Teks yang disunting mesti diterjemah semula, jika tidak pembaca Inggeris
  // kekal melihat versi lama selamanya.
  simpanTerjemahanBerita(parsed.data.id, {
    title: parsed.data.title,
    body: parsed.data.body || null,
  });
  return NextResponse.json({ ok: true });
}

// Padam berita (RLS: hanya coach/admin).
export async function DELETE(request: Request) {
  // GATE ALLOWLIST — akaun mesti diluluskan admin sebelum apa-apa data disentuh.
  const gate = await requireCoachApi();
  if (!gate.ok) return gate.response;

  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Sila log masuk." }, { status: 401 });
  }
  const id = new URL(request.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ ok: false, error: "id diperlukan." }, { status: 400 });
  }

  const supabase = await createServerSupabase();
  // Slug diambil SEBELUM padam — selepas itu ia hilang, dan tanpa slug kita
  // tidak dapat memberitahu enjin carian bahawa alamat itu sudah tiada.
  const { data: sebelum } = await supabase
    .from("news")
    .select("slug")
    .eq("id", id)
    .maybeSingle();
  const { error } = await supabase.from("news").delete().eq("id", id);
  if (error) {
    console.error("[coach/news] padam gagal:", error.message);
    return NextResponse.json({ ok: false, error: "Gagal padam." }, { status: 403 });
  }
  const slugDipadam = (sebelum as { slug?: string | null } | null)?.slug;
  if (slugDipadam) revalidatePath(`/berita/${slugDipadam}`);
  // IndexNow menerima alamat yang sudah dibuang juga — 404 dijumpai lebih
  // cepat, jadi pautan mati keluar dari hasil carian lebih awal.
  beritahuEnjinCarian(
    slugDipadam ? ["/", "/berita", `/berita/${slugDipadam}`] : ["/", "/berita"]
  );
  // Buang notifikasi berita berkaitan supaya tak tertinggal di loceng.
  await supabase.from("notifications").delete().eq("ref_type", "news").eq("ref_id", id);
  revalidatePath("/");
  revalidatePath("/berita");
  return NextResponse.json({ ok: true });
}
