"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, TriangleAlert } from "lucide-react";
import {
  orderSchema,
  type OrderInput,
  childSizes,
  adultSizes,
  UNIT_PRICE,
} from "@/lib/order-schema";
import Button from "@/components/ui/Button";
import Reveal from "@/components/ui/Reveal";
import { useLang } from "@/lib/i18n";

const inputCls =
  "w-full rounded-lg border border-line bg-ink px-4 py-3 font-sans text-sm text-paper placeholder:text-muted/60 outline-none transition-colors focus:border-amber focus-visible:border-amber";
const labelCls = "mb-2 block font-sans text-sm font-medium text-paper/90";
const errCls = "mt-1.5 font-sans text-xs text-amber";
const groupTitleCls = "display text-xl text-paper border-b border-line pb-3 mb-5";

const ringgit = (n: number) =>
  `RM ${n.toLocaleString("ms-MY", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

function FieldError({ msg }: { msg?: string }) {
  return msg ? <p className={errCls}>{msg}</p> : null;
}

export default function OrderForm() {
  const { t } = useLang();
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<OrderInput>({
    resolver: zodResolver(orderSchema),
    mode: "onBlur",
    defaultValues: { quantity: 1 },
  });

  // Kira jumlah secara langsung (kuantiti × harga seunit).
  const qty = Number(useWatch({ control, name: "quantity" })) || 0;
  const total = qty * UNIT_PRICE;

  // Auto-UPPERCASE untuk nama.
  const upper = (name: keyof OrderInput) => {
    const r = register(name);
    return {
      ...r,
      onChange: (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
      ) => {
        e.target.value = e.target.value.toUpperCase();
        return r.onChange(e);
      },
    };
  };

  const onSubmit = async (data: OrderInput) => {
    setSubmitError(false);
    try {
      const res = await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Gagal menyimpan");
    } catch {
      setSubmitError(true);
      return;
    }

    setSubmitted(true);
    reset({ quantity: 1 });
  };

  return (
    <section id="tempah" className="bg-ink py-24 sm:py-32">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <Reveal>
          <span className="font-sans text-sm font-semibold uppercase tracking-[0.3em] text-amber">
            Training Kit 2026
          </span>
        </Reveal>
        <Reveal delay={0.1}>
          <h2 className="display mt-5 text-5xl text-paper sm:text-7xl">
            {t("Tempah", "Order")} <span className="text-outline">Hustle Gear</span>
          </h2>
        </Reveal>
        <Reveal delay={0.15}>
          <p className="mx-auto mt-5 max-w-xl font-sans text-base text-muted">
            {t(
              "Pakaian rasmi sesi latihan Stingers Hockey. Isi borang di bawah untuk tempah.",
              "The official Stingers Hockey training kit. Fill in the form below to order."
            )}{" "}
            {t(`Harga ${ringgit(UNIT_PRICE)} seunit.`, `Price ${ringgit(UNIT_PRICE)} per unit.`)}
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
                {t("Tempahan Berjaya Dihantar!", "Order Submitted Successfully!")}
              </h3>
              <p className="font-sans text-muted">
                {t(
                  "Terima kasih. Kami akan hubungi anda untuk pengesahan saiz dan pembayaran.",
                  "Thank you. We'll contact you to confirm sizing and payment."
                )}
              </p>
              <button
                type="button"
                onClick={() => setSubmitted(false)}
                className="mt-2 font-sans text-sm font-semibold uppercase tracking-wider text-amber hover:text-amber-deep"
              >
                {t("Buat tempahan lain", "Place another order")}
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
              {/* Maklumat Penempah */}
              <fieldset>
                <legend className={groupTitleCls}>
                  {t("Maklumat Penempah", "Orderer Details")}
                </legend>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label htmlFor="fullName" className={labelCls}>
                      {t("Nama Penuh (huruf besar) *", "Full Name (uppercase) *")}
                    </label>
                    <input
                      id="fullName"
                      className={`${inputCls} uppercase`}
                      placeholder="CONTOH BIN CONTOH"
                      aria-invalid={!!errors.fullName}
                      {...upper("fullName")}
                    />
                    <FieldError msg={errors.fullName?.message} />
                  </div>
                  <div>
                    <label htmlFor="phone" className={labelCls}>
                      {t("No. Telefon *", "Phone No. *")}
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      inputMode="numeric"
                      className={inputCls}
                      placeholder={t("0123456789 (tanpa -)", "0123456789 (no -)")}
                      aria-invalid={!!errors.phone}
                      {...register("phone")}
                    />
                    <FieldError msg={errors.phone?.message} />
                  </div>
                  <div>
                    <label htmlFor="email" className={labelCls}>
                      Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      className={inputCls}
                      placeholder={t("anda@contoh.com (pilihan)", "you@example.com (optional)")}
                      aria-invalid={!!errors.email}
                      {...register("email")}
                    />
                    <FieldError msg={errors.email?.message} />
                  </div>
                </div>
              </fieldset>

              {/* Butiran Tempahan */}
              <fieldset>
                <legend className={groupTitleCls}>
                  {t("Butiran Tempahan", "Order Details")}
                </legend>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="size" className={labelCls}>
                      {t("Saiz Baju *", "Shirt Size *")}
                    </label>
                    <select
                      id="size"
                      className={inputCls}
                      defaultValue=""
                      aria-invalid={!!errors.size}
                      {...register("size")}
                    >
                      <option value="" disabled>
                        {t("Pilih saiz…", "Choose size…")}
                      </option>
                      <optgroup label={t("Saiz Nombor (24–32)", "Number Sizes (24–32)")}>
                        {childSizes.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label={t("Saiz Huruf (2XS–7XL)", "Letter Sizes (2XS–7XL)")}>
                        {adultSizes.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </optgroup>
                    </select>
                    <FieldError msg={errors.size?.message} />
                  </div>
                  <div>
                    <label htmlFor="quantity" className={labelCls}>
                      {t("Kuantiti *", "Quantity *")}
                    </label>
                    <input
                      id="quantity"
                      type="number"
                      min={1}
                      max={50}
                      className={inputCls}
                      aria-invalid={!!errors.quantity}
                      {...register("quantity", { valueAsNumber: true })}
                    />
                    <FieldError msg={errors.quantity?.message} />
                  </div>
                </div>

                {/* Ringkasan harga */}
                <div className="mt-6 flex items-center justify-between rounded-lg border border-amber/40 bg-amber/10 px-5 py-4">
                  <div className="font-sans text-sm text-paper/90">
                    {qty > 0 ? (
                      <>
                        {qty} {t("unit", "units")} × {ringgit(UNIT_PRICE)}
                      </>
                    ) : (
                      <>{t(`Harga ${ringgit(UNIT_PRICE)} seunit`, `Price ${ringgit(UNIT_PRICE)} per unit`)}</>
                    )}
                  </div>
                  <div className="display text-2xl text-amber">
                    {ringgit(total)}
                  </div>
                </div>

                <div className="mt-5">
                  <label htmlFor="notes" className={labelCls}>
                    {t("Catatan Tambahan", "Additional Notes")}
                  </label>
                  <textarea
                    id="notes"
                    rows={3}
                    className={`${inputCls} resize-y uppercase`}
                    placeholder={t(
                      "Cth: campur saiz, kutipan, dll. (pilihan)",
                      "E.g. mixed sizes, collection, etc. (optional)"
                    )}
                    {...upper("notes")}
                  />
                  <FieldError msg={errors.notes?.message} />
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
                    {t(
                      "Saya mengesahkan butiran tempahan ini betul dan bersetuju untuk membuat pembayaran.",
                      "I confirm these order details are correct and agree to make payment."
                    )}
                  </span>
                </label>
                <FieldError msg={errors.consent?.message} />
              </div>

              {submitError && (
                <div className="flex items-start gap-3 rounded-lg border border-amber/50 bg-amber/10 p-4">
                  <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber" />
                  <p className="font-sans text-sm text-paper/90">
                    {t(
                      "Maaf, tempahan gagal dihantar. Sila cuba sekali lagi, atau hubungi kami terus di",
                      "Sorry, the order failed to send. Please try again, or contact us directly at"
                    )}{" "}
                    <a href="tel:+60389413905" className="text-amber underline">
                      03-8941 3905
                    </a>
                    .
                  </p>
                </div>
              )}

              <Button type="submit" fullWidth disabled={isSubmitting}>
                {isSubmitting
                  ? t("Menghantar…", "Submitting…")
                  : t("Hantar Tempahan →", "Submit Order →")}
              </Button>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
