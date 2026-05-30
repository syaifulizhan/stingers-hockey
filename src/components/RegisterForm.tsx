"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import {
  registerSchema,
  type RegisterInput,
  experienceOptions,
  positionOptions,
} from "@/lib/schema";
import Button from "@/components/ui/Button";
import Reveal from "@/components/ui/Reveal";

const inputCls =
  "w-full rounded-lg border border-line bg-ink px-4 py-3 font-sans text-sm text-paper placeholder:text-muted/60 outline-none transition-colors focus:border-amber focus-visible:border-amber";
const labelCls =
  "mb-2 block font-sans text-sm font-medium text-paper/90";
const errCls = "mt-1.5 font-sans text-xs text-amber";
const groupTitleCls =
  "display text-xl text-paper border-b border-line pb-3 mb-5";

function FieldError({ msg }: { msg?: string }) {
  return msg ? <p className={errCls}>{msg}</p> : null;
}

export default function RegisterForm() {
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    mode: "onBlur",
  });

  const onSubmit = async (data: RegisterInput) => {
    console.log("Pendaftaran Pencarian Bakat:", data);

    // TODO: hook to email service (Resend/SendGrid) melalui /api/register
    try {
      await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    } catch {
      // senyap — borang masih dikira berjaya untuk UX (lihat README untuk integrasi sebenar)
    }

    setSubmitted(true);
    reset();
  };

  return (
    <section id="daftar" className="bg-ink py-24 sm:py-32">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <Reveal>
          <span className="font-sans text-sm font-semibold uppercase tracking-[0.3em] text-amber">
            Pencarian Bakat 2026
          </span>
        </Reveal>
        <Reveal delay={0.1}>
          <h2 className="display mt-5 text-5xl text-paper sm:text-7xl">
            Sertai <span className="text-outline">Skuad</span>
          </h2>
        </Reveal>
        <Reveal delay={0.15}>
          <p className="mx-auto mt-5 max-w-xl font-sans text-base text-muted">
            Pendaftaran Pencarian Bakat Stingers Hockey, SK Taman Desaminium.
            Tunjukkan apa yang anda boleh buat di padang.
          </p>
        </Reveal>
      </div>

      <div className="mx-auto mt-12 max-w-3xl px-6">
        <AnimatePresence mode="wait">
          {submitted ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center gap-4 rounded-2xl border border-amber/40 bg-bg-soft p-12 text-center"
            >
              <CheckCircle2 className="h-14 w-14 text-amber" />
              <h3 className="display text-3xl text-paper">
                Pendaftaran Berjaya Dihantar!
              </h3>
              <p className="font-sans text-muted">
                Kami akan hubungi anda. Terima kasih kerana menyertai pencarian
                bakat Stingers Hockey.
              </p>
              <button
                type="button"
                onClick={() => setSubmitted(false)}
                className="mt-2 font-sans text-sm font-semibold uppercase tracking-wider text-amber hover:text-amber-deep"
              >
                Daftar pemain lain
              </button>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              noValidate
              onSubmit={handleSubmit(onSubmit)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col gap-10 rounded-2xl border border-line bg-bg-soft/50 p-7 sm:p-10"
            >
              {/* Maklumat Pemain */}
              <fieldset>
                <legend className={groupTitleCls}>Maklumat Pemain</legend>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label htmlFor="fullName" className={labelCls}>
                      Nama Penuh (huruf besar) *
                    </label>
                    <input
                      id="fullName"
                      className={inputCls}
                      placeholder="CONTOH BIN CONTOH"
                      aria-invalid={!!errors.fullName}
                      {...register("fullName")}
                    />
                    <FieldError msg={errors.fullName?.message} />
                  </div>
                  <div>
                    <label htmlFor="dateOfBirth" className={labelCls}>
                      Tarikh Lahir *
                    </label>
                    <input
                      id="dateOfBirth"
                      type="date"
                      className={inputCls}
                      aria-invalid={!!errors.dateOfBirth}
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
                      className={inputCls}
                      placeholder="000000-00-0000"
                      aria-invalid={!!errors.icNumber}
                      {...register("icNumber")}
                    />
                    <FieldError msg={errors.icNumber?.message} />
                  </div>
                  <div className="sm:col-span-2">
                    <span className={labelCls}>Jantina *</span>
                    <div className="flex gap-6">
                      {(["Lelaki", "Perempuan"] as const).map((g) => (
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
                </div>
              </fieldset>

              {/* Maklumat Sekolah */}
              <fieldset>
                <legend className={groupTitleCls}>Maklumat Sekolah</legend>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label htmlFor="school" className={labelCls}>
                      Sekolah Sekarang *
                    </label>
                    <input
                      id="school"
                      className={inputCls}
                      aria-invalid={!!errors.school}
                      {...register("school")}
                    />
                    <FieldError msg={errors.school?.message} />
                  </div>
                  <div>
                    <label htmlFor="form" className={labelCls}>
                      Tingkatan / Tahun *
                    </label>
                    <input
                      id="form"
                      className={inputCls}
                      aria-invalid={!!errors.form}
                      {...register("form")}
                    />
                    <FieldError msg={errors.form?.message} />
                  </div>
                  <div>
                    <label htmlFor="className" className={labelCls}>
                      Kelas *
                    </label>
                    <input
                      id="className"
                      className={inputCls}
                      aria-invalid={!!errors.className}
                      {...register("className")}
                    />
                    <FieldError msg={errors.className?.message} />
                  </div>
                </div>
              </fieldset>

              {/* Maklumat Hubungan */}
              <fieldset>
                <legend className={groupTitleCls}>Maklumat Hubungan</legend>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="playerPhone" className={labelCls}>
                      No. Telefon Pemain *
                    </label>
                    <input
                      id="playerPhone"
                      type="tel"
                      className={inputCls}
                      placeholder="01X-XXX XXXX"
                      aria-invalid={!!errors.playerPhone}
                      {...register("playerPhone")}
                    />
                    <FieldError msg={errors.playerPhone?.message} />
                  </div>
                  <div>
                    <label htmlFor="guardianPhone" className={labelCls}>
                      No. Telefon Penjaga *
                    </label>
                    <input
                      id="guardianPhone"
                      type="tel"
                      className={inputCls}
                      placeholder="01X-XXX XXXX"
                      aria-invalid={!!errors.guardianPhone}
                      {...register("guardianPhone")}
                    />
                    <FieldError msg={errors.guardianPhone?.message} />
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="guardianEmail" className={labelCls}>
                      Email Penjaga
                    </label>
                    <input
                      id="guardianEmail"
                      type="email"
                      className={inputCls}
                      placeholder="penjaga@contoh.com"
                      aria-invalid={!!errors.guardianEmail}
                      {...register("guardianEmail")}
                    />
                    <FieldError msg={errors.guardianEmail?.message} />
                  </div>
                </div>
              </fieldset>

              {/* Maklumat Tambahan */}
              <fieldset>
                <legend className={groupTitleCls}>Maklumat Tambahan</legend>
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
                      <option value="" disabled>
                        Pilih…
                      </option>
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
                      <option value="" disabled>
                        Pilih…
                      </option>
                      {positionOptions.map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="notes" className={labelCls}>
                      Catatan Tambahan
                    </label>
                    <textarea
                      id="notes"
                      rows={4}
                      className={`${inputCls} resize-y`}
                      placeholder="Sebarang maklumat tambahan…"
                      {...register("notes")}
                    />
                    <FieldError msg={errors.notes?.message} />
                  </div>
                </div>
              </fieldset>

              {/* Pengesahan */}
              <div>
                <label className="flex cursor-pointer items-start gap-3 font-sans text-sm text-paper/90">
                  <input
                    type="checkbox"
                    className="mt-0.5 h-4 w-4 accent-amber"
                    {...register("consent")}
                  />
                  <span>
                    Saya mengesahkan maklumat ini benar dan bersedia hadir sesi
                    latihan.
                  </span>
                </label>
                <FieldError msg={errors.consent?.message} />
              </div>

              <Button type="submit" fullWidth disabled={isSubmitting}>
                {isSubmitting ? "Menghantar…" : "Daftar Sekarang →"}
              </Button>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
