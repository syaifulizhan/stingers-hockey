import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase/server";

// Coach post berita. RLS (news_write = is_coach) menguatkuasakan kebenaran.
const schema = z.object({
  title: z.string().trim().min(1, { message: "Tajuk diperlukan." }).max(200),
  body: z.string().trim().max(2000).optional().or(z.literal("")),
  imageUrl: z.string().url().optional().or(z.literal("")),
});

export async function POST(request: Request) {
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

  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("news")
    .insert({
      title: parsed.data.title,
      body: parsed.data.body || null,
      image_url: parsed.data.imageUrl || null,
      author: userId,
    })
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("[coach/news] gagal:", error.message);
    return NextResponse.json(
      { ok: false, error: "Gagal post berita (mungkin anda bukan jurulatih)." },
      { status: 403 }
    );
  }

  // Notifikasi broadcast kepada semua ahli.
  await supabase.from("notifications").insert({
    user_id: null,
    title: `Berita baharu: ${parsed.data.title}`,
    link: data?.id ? `/portal/news/${data.id}` : "/portal/dashboard",
  });

  return NextResponse.json({ ok: true });
}

// Edit berita (tajuk + isi).
const editSchema = z.object({
  id: z.string().uuid(),
  title: z.string().trim().min(1, { message: "Tajuk diperlukan." }).max(200),
  body: z.string().trim().max(2000).optional().or(z.literal("")),
});

export async function PATCH(request: Request) {
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
  const { error } = await supabase
    .from("news")
    .update({ title: parsed.data.title, body: parsed.data.body || null })
    .eq("id", parsed.data.id);
  if (error) {
    console.error("[coach/news] edit gagal:", error.message);
    return NextResponse.json({ ok: false, error: "Gagal kemas kini berita." }, { status: 403 });
  }
  return NextResponse.json({ ok: true });
}

// Padam berita (RLS: hanya coach/admin).
export async function DELETE(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Sila log masuk." }, { status: 401 });
  }
  const id = new URL(request.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ ok: false, error: "id diperlukan." }, { status: 400 });
  }

  const supabase = await createServerSupabase();
  const { error } = await supabase.from("news").delete().eq("id", id);
  if (error) {
    console.error("[coach/news] padam gagal:", error.message);
    return NextResponse.json({ ok: false, error: "Gagal padam." }, { status: 403 });
  }
  return NextResponse.json({ ok: true });
}
