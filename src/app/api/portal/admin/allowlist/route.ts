import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { auth } from "@clerk/nextjs/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/portal/admin/allowlist — Dapatkan senarai domain allowlist
export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Tidak login" }, { status: 401 });
  }

  // Semua orang boleh baca domain allowlist
  const { data, error } = await supabase
    .from("domain_allowlist")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ domains: data });
}

// POST /api/portal/admin/allowlist — Tambah domain baru (hanya admin)
export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Tidak login" }, { status: 401 });
  }

  const body = await request.json();
  const { domain } = body;

  if (!domain || typeof domain !== "string") {
    return NextResponse.json(
      { error: "Domain tidak sah" },
      { status: 400 }
    );
  }

  // Semak admin/coach
  const { data: user } = await supabase
    .from("users")
    .select("role")
    .eq("clerk_user_id", userId)
    .single();

  if (!user || !["admin", "coach"].includes(user.role)) {
    return NextResponse.json(
      { error: "Hanya admin/coach boleh tambah domain" },
      { status: 403 }
    );
  }

  const { data, error } = await supabase
    .from("domain_allowlist")
    .insert([{ domain: domain.toLowerCase(), created_by: userId }])
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "Domain sudah ada dalam senarai" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ domain: data });
}

// DELETE /api/portal/admin/allowlist — Buang domain dari senarai (hanya admin)
export async function DELETE(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Tidak login" }, { status: 401 });
  }

  const body = await request.json();
  const { domain } = body;

  if (!domain) {
    return NextResponse.json({ error: "Domain diperlukan" }, { status: 400 });
  }

  // Semak admin
  const { data: user } = await supabase
    .from("users")
    .select("role")
    .eq("clerk_user_id", userId)
    .single();

  if (!user || user.role !== "admin") {
    return NextResponse.json(
      { error: "Hanya admin boleh buang domain" },
      { status: 403 }
    );
  }

  const { error } = await supabase
    .from("domain_allowlist")
    .delete()
    .eq("domain", domain.toLowerCase());

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
