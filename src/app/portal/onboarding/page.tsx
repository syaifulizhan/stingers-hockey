import { auth, currentUser } from "@clerk/nextjs/server";
import { createServerSupabase } from "@/lib/supabase/server";
import OnboardingForm from "@/components/portal/OnboardingForm";
import type { ProfileInput } from "@/lib/portal-schema";

export default async function OnboardingPage() {
  const { userId } = await auth();
  const user = await currentUser();

  // Ambil profil sedia ada (jika ada) untuk pra-isi borang.
  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from("users")
    .select("*")
    .eq("clerk_user_id", userId!)
    .maybeSingle();

  const defaultName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    user?.username ||
    "";

  const initial: Partial<ProfileInput> = {
    fullName: data?.full_name ?? defaultName,
    year: data?.year ?? "",
    className: data?.class ?? "",
    dateOfBirth: data?.date_of_birth ?? "",
    gender: data?.gender ?? undefined,
    icNumber: data?.ic_number ?? "",
    school: data?.school ?? "",
    schoolRegNo: data?.school_reg_no ?? "",
    playerPhone: data?.player_phone ?? "",
    guardianPhone: data?.guardian_phone ?? "",
    guardianEmail: data?.guardian_email ?? "",
    experience: data?.experience ?? undefined,
    position: data?.position ?? undefined,
    notes: data?.notes ?? "",
  };

  return <OnboardingForm initial={initial} />;
}
