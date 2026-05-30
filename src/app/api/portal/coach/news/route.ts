import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase/server";

// Coach post berita. RLS (news_write = is_coach) menguatkuasakan kebenaran.
const schema = z.object({
  title: z.string().trim().min(1, { message: "Tajuk diperlukan." }).max(200),
  body: z.string().trim().max(2000).optional().or(z.literal("")),
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
  const { error } = await supabase.from("news").insert({
    title: parsed.data.title,
    body: parsed.data.body || null,
    author: userId,
  });

  if (error) {
    console.error("[coach/news] gagal:", error.message);
    return NextResponse.json(
      { ok: false, error: "Gagal post berita (mungkin anda bukan jurulatih)." },
      { status: 403 }
    );
  }
  return NextResponse.json({ ok: true });
}
