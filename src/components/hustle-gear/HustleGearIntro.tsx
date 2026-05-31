"use client";

import SmartImage from "@/components/ui/SmartImage";
import Reveal from "@/components/ui/Reveal";
import Button from "@/components/ui/Button";
import { useLang } from "@/lib/i18n";

export default function HustleGearIntro() {
  const { t } = useLang();
  return (
    <>
      {/* Hero ringkas */}
      <section className="relative overflow-hidden pt-36 pb-16 sm:pt-44 sm:pb-20">
        <div className="pointer-events-none absolute -right-24 top-10 h-72 w-72 rounded-full bg-amber/20 blur-3xl" />
        <div className="pointer-events-none absolute -left-24 bottom-0 h-64 w-64 rounded-full bg-amber-deep/15 blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-6 lg:grid-cols-[1.3fr_1fr] lg:items-center lg:gap-12">
          <div>
            <Reveal>
              <span className="font-sans text-sm font-semibold uppercase tracking-[0.3em] text-amber">
                Training Kit 2026
              </span>
            </Reveal>
            <Reveal delay={0.1}>
              <h1 className="display mt-5 text-6xl text-paper sm:text-7xl">
                Hustle Gear
                <br />
                <span className="text-amber">
                  {t("Buat Tempahan", "Place Your Order")}
                </span>
              </h1>
            </Reveal>
            <Reveal delay={0.15}>
              <p className="mt-6 max-w-lg font-sans text-base leading-relaxed text-muted">
                {t(
                  "Pakaian rasmi sesi latihan pasukan — direka khas untuk keselesaan dan identiti pemain Stingers Hockey di padang. Tempah saiz anda di bawah.",
                  "The official team training kit — designed for the comfort and identity of Stingers Hockey players on the field. Order your size below."
                )}
              </p>
            </Reveal>
            <Reveal delay={0.2}>
              <div className="mt-8 flex flex-wrap gap-4">
                <Button href="#tempah">{t("Borang Tempahan →", "Order Form →")}</Button>
                <Button href="/" variant="outline">
                  {t("Kembali ke Laman Utama", "Back to Home")}
                </Button>
              </div>
            </Reveal>
          </div>

          <Reveal delay={0.1}>
            <SmartImage
              src="/images/hustle-gear-2026.jpg"
              alt="Hustle Gear training kit Stingers Hockey 2026"
              label="Hustle Gear"
              className="aspect-square w-full rounded-2xl border border-line"
              sizes="(max-width: 1024px) 100vw, 40vw"
              fit="contain"
            />
          </Reveal>
        </div>
      </section>

      {/* Carta saiz */}
      <section className="mx-auto max-w-3xl px-6 pb-4">
        <Reveal>
          <h2 className="display mb-5 text-center text-3xl text-paper sm:text-4xl">
            {t("Carta", "Size")} <span className="text-amber">{t("Saiz", "Chart")}</span>
          </h2>
        </Reveal>
        <Reveal delay={0.1}>
          <SmartImage
            src="/images/hustle-gear-2026-size-chart.jpg"
            alt="Carta saiz Hustle Gear 2026 — bahu, dada, lengan, panjang"
            label="Carta Saiz"
            className="aspect-square w-full rounded-2xl border border-line"
            sizes="(max-width: 768px) 100vw, 768px"
            fit="contain"
          />
          <p className="mt-3 text-center font-sans text-xs text-muted">
            {t(
              "Rujuk carta sebelum pilih saiz. Nota: warna, GSM & saiz mungkin berbeza ±5%.",
              "Check the chart before choosing your size. Note: colour, GSM & size may vary ±5%."
            )}
          </p>
        </Reveal>
      </section>
    </>
  );
}
