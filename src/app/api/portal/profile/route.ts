import { NextResponse } from "next/server";
import { auth, currentUser, clerkClient } from "@clerk/nextjs/server";
import { profileSchema } from "@/lib/portal-schema";
import { createServerSupabase } from "@/lib/supabase/server";

// Simpan profil ahli:
//   1. Tulis ke Supabase (jadual users) — sumber utama portal.
//   2. Cermin ke Google Sheet "Pendaftaran" — kekalkan aliran sedia ada coach.
//   3. Tanda onboarding selesai di Clerk (untuk logik redirect).
export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      { ok: false, error: "Sila log masuk." },
      { status: 401 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Permintaan tidak sah." },
      { status: 400 }
    );
  }

  const parsed = profileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, errors: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }
  const d = parsed.data;

  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress ?? null;

  // 1. Simpan ke Supabase (RLS: hanya boleh tulis baris sendiri).
  const supabase = await createServerSupabase();
  const { error } = await supabase.from("users").upsert(
    {
      clerk_user_id: userId,
      full_name: d.fullName,
      email,
      year: d.year,
      class: d.className,
      date_of_birth: d.dateOfBirth || null,
      ic_number: d.icNumber,
      gender: d.gender,
      school: d.school,
      school_reg_no: d.schoolRegNo || null,
      player_phone: d.playerPhone || null,
      guardian_phone: d.guardianPhone,
      guardian_email: d.guardianEmail || null,
      experience: d.experience || null,
      position: d.position || null,
      notes: d.notes || null,
      profile_complete: true,
    },
    { onConflict: "clerk_user_id" }
  );

  if (error) {
    console.error("[portal/profile] Supabase gagal:", error.message);
    return NextResponse.json(
      { ok: false, error: "Gagal menyimpan ke database." },
      { status: 500 }
    );
  }

  // 2. Cermin ke Google Sheet (best-effort — jangan gagalkan jika Sheet tiada).
  const webhook = process.env.SHEETS_WEBHOOK_URL;
  if (webhook) {
    try {
      await fetch(webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // Tiada formType → Apps Script tulis ke sheet "Pendaftaran".
          fullName: d.fullName,
          dateOfBirth: d.dateOfBirth,
          gender: d.gender,
          icNumber: d.icNumber,
          school: d.school,
          schoolRegNo: d.schoolRegNo,
          year: d.year,
          className: d.className,
          playerPhone: d.playerPhone,
          guardianPhone: d.guardianPhone,
          guardianEmail: d.guardianEmail,
          experience: d.experience,
          position: d.position,
          notes: d.notes,
          consent: true,
          submittedAt: new Date().toISOString(),
        }),
      });
    } catch (err) {
      console.error("[portal/profile] cermin Sheet gagal:", err);
    }
  }

  // 3. Tanda onboarding selesai di Clerk.
  try {
    const client = await clerkClient();
    await client.users.updateUser(userId, {
      publicMetadata: { onboardingComplete: true },
    });
  } catch (err) {
    console.error("[portal/profile] kemaskini Clerk gagal:", err);
  }

  return NextResponse.json({ ok: true });
}
