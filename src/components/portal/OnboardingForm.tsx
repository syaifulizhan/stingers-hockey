"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { TriangleAlert } from "lucide-react";
import {
  profileSchema,
  type ProfileInput,
  profileFields,
  step1Fields,
  genderOptions,
  experienceOptions,
  positionOptions,
} from "@/lib/portal-schema";

const inputCls =
  "w-full rounded-lg border border-line bg-ink px-4 py-3 font-sans text-sm text-paper placeholder:text-muted/60 outline-none transition-colors focus:border-amber focus-visible:border-amber";
const labelCls = "mb-2 block font-sans text-sm font-medium text-paper/90";
const errCls = "mt-1.5 font-sans text-xs text-amber";

function FieldError({ msg }: { msg?: string }) {
  return msg ? <p className={errCls}>{msg}</p> : null;
}

export default function OnboardingForm({
  initial,
}: {
  initial: Partial<ProfileInput>;
}) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    trigger,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    mode: "onBlur",
    defaultValues: {
      fullName: initial.fullName ?? "",
      year: initial.year ?? "",
      className: initial.className ?? "",
      dateOfBirth: initial.dateOfBirth ?? "",
      gender: initial.gender,
      icNumber: initial.icNumber ?? "",
      school: initial.school ?? "",
      schoolRegNo: initial.schoolRegNo ?? "",
      playerPhone: initial.playerPhone ?? "",
      guardianPhone: initial.guardianPhone ?? "",
      guardianEmail: initial.guardianEmail ?? "",
      experience: initial.experience,
      position: initial.position,
      notes: initial.notes ?? "",
    },
  });

  // Peratus "% lengkap" — dikira langsung dari medan yang diisi.
  const values = useWatch({ control });
  const filled = profileFields.filter((f) => {
    const v = values[f as keyof typeof values];
    return typeof v === "string" ? v.trim() !== "" : !!v;
  }).length;
  const percent = Math.round((filled / profileFields.length) * 100);

  const next = async () => {
    const ok = await trigger(step1Fields as unknown as (keyof ProfileInput)[]);
    if (ok) setStep(2);
  };

  const onSubmit = async (data: ProfileInput) => {
    setSubmitError(null);
    try {
      const res = await fetch("/api/portal/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => null);
        throw new Error(j?.error || "Gagal menyimpan.");
      }
    } catch (e) {
      setSubmitError(
        e instanceof Error ? e.message : "Gagal menyimpan. Cuba lagi."
      );
      return;
    }
    router.push("/portal/dashboard");
    router.refresh();
  };

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-12">
      <div className="text-center">
        <span className="font-sans text-sm font-semibold uppercase tracking-[0.3em] text-amber">
          Lengkapkan Profil
        </span>
        <h1 className="display mt-3 text-4xl text-paper sm:text-5xl">
          {step === 1 ? "Maklumat Ringkas" : "Maklumat Penuh"}
        </h1>
      </div>

      {/* Progress bar */}
      <div className="mt-8">
        <div className="mb-2 flex items-center justify-between font-sans text-sm">
          <span className="text-muted">Profil lengkap</span>
          <span className="font-semibold text-amber">{percent}%</span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-bg-soft">
          <motion.div
            className="h-full rounded-full bg-amber"
            animate={{ width: `${percent}%` }}
            transition={{ type: "spring", stiffness: 120, damping: 20 }}
          />
        </div>
        <div className="mt-2 font-sans text-xs text-muted">
          Langkah {step} daripada 2
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-8">
        {step === 1 ? (
          <div className="flex flex-col gap-5">
            <div>
              <label htmlFor="fullName" className={labelCls}>
                Nama Penuh *
              </label>
              <input
                id="fullName"
                className={inputCls}
                placeholder="Contoh Bin Contoh"
                {...register("fullName")}
              />
              <FieldError msg={errors.fullName?.message} />
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="year" className={labelCls}>
                  Tahun *
                </label>
                <input
                  id="year"
                  className={inputCls}
                  placeholder="Cth: 5"
                  {...register("year")}
                />
                <FieldError msg={errors.year?.message} />
              </div>
              <div>
                <label htmlFor="className" className={labelCls}>
                  Kelas *
                </label>
                <input
                  id="className"
                  className={inputCls}
                  placeholder="Cth: 5 Bestari"
                  {...register("className")}
                />
                <FieldError msg={errors.className?.message} />
              </div>
            </div>

            <button
              type="button"
              onClick={next}
              className="mt-3 rounded-full bg-amber px-7 py-3 font-sans text-sm font-semibold uppercase tracking-wider text-ink transition-colors hover:bg-amber-deep"
            >
              Seterusnya →
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="dateOfBirth" className={labelCls}>
                  Tarikh Lahir *
                </label>
                <input
                  id="dateOfBirth"
                  type="date"
                  className={inputCls}
                  {...register("dateOfBirth")}
                />
                <FieldError msg={errors.dateOfBirth?.message} />
              </div>
              <div>
                <label htmlFor="icNumber" className={labelCls}>
                  No. Kad Pengenalan *
                </label>
                <input
                  id="icNumber"
                  inputMode="numeric"
                  className={inputCls}
                  placeholder="000000000000"
                  {...register("icNumber")}
                />
                <FieldError msg={errors.icNumber?.message} />
              </div>
            </div>

            <div>
              <span className={labelCls}>Jantina *</span>
              <div className="flex gap-6">
                {genderOptions.map((g) => (
                  <label
                    key={g}
                    className="flex cursor-pointer items-center gap-2 font-sans text-sm text-paper/90"
                  >
                    <input
                      type="radio"
                      value={g}
                      className="accent-amber"
                      {...register("gender")}
                    />
                    {g}
                  </label>
                ))}
              </div>
              <FieldError msg={errors.gender?.message} />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="school" className={labelCls}>
                  Sekolah *
                </label>
                <input id="school" className={inputCls} {...register("school")} />
                <FieldError msg={errors.school?.message} />
              </div>
              <div>
                <label htmlFor="schoolRegNo" className={labelCls}>
                  No. Pendaftaran Sekolah
                </label>
                <input
                  id="schoolRegNo"
                  className={inputCls}
                  placeholder="Pilihan"
                  {...register("schoolRegNo")}
                />
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="playerPhone" className={labelCls}>
                  No. Telefon Pemain
                </label>
                <input
                  id="playerPhone"
                  type="tel"
                  inputMode="numeric"
                  className={inputCls}
                  placeholder="Pilihan"
                  {...register("playerPhone")}
                />
              </div>
              <div>
                <label htmlFor="guardianPhone" className={labelCls}>
                  No. Telefon Penjaga *
                </label>
                <input
                  id="guardianPhone"
                  type="tel"
                  inputMode="numeric"
                  className={inputCls}
                  placeholder="0123456789"
                  {...register("guardianPhone")}
                />
                <FieldError msg={errors.guardianPhone?.message} />
              </div>
            </div>

            <div>
              <label htmlFor="guardianEmail" className={labelCls}>
                Email Penjaga
              </label>
              <input
                id="guardianEmail"
                type="email"
                className={inputCls}
                placeholder="penjaga@contoh.com (pilihan)"
                {...register("guardianEmail")}
              />
              <FieldError msg={errors.guardianEmail?.message} />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="experience" className={labelCls}>
                  Pengalaman Hoki
                </label>
                <select
                  id="experience"
                  className={inputCls}
                  defaultValue=""
                  {...register("experience")}
                >
                  <option value="">Pilih…</option>
                  {experienceOptions.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="position" className={labelCls}>
                  Posisi Pilihan
                </label>
                <select
                  id="position"
                  className={inputCls}
                  defaultValue=""
                  {...register("position")}
                >
                  <option value="">Pilih…</option>
                  {positionOptions.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="notes" className={labelCls}>
                Catatan Tambahan
              </label>
              <textarea
                id="notes"
                rows={3}
                className={`${inputCls} resize-y`}
                placeholder="Sebarang maklumat tambahan… (pilihan)"
                {...register("notes")}
              />
              <FieldError msg={errors.notes?.message} />
            </div>

            {submitError && (
              <div className="flex items-start gap-3 rounded-lg border border-amber/50 bg-amber/10 p-4">
                <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber" />
                <p className="font-sans text-sm text-paper/90">{submitError}</p>
              </div>
            )}

            <div className="mt-2 flex gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="rounded-full border border-line px-6 py-3 font-sans text-sm font-semibold uppercase tracking-wider text-paper transition-colors hover:border-amber hover:text-amber"
              >
                ← Kembali
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 rounded-full bg-amber px-7 py-3 font-sans text-sm font-semibold uppercase tracking-wider text-ink transition-colors hover:bg-amber-deep disabled:opacity-60"
              >
                {isSubmitting ? "Menyimpan…" : "Simpan Profil ✓"}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
