"use client";

import Button from "@/components/ui/Button";
import SmartImage from "@/components/ui/SmartImage";
import Reveal from "@/components/ui/Reveal";
import { useLang } from "@/lib/i18n";

export default function HustleGear({
  jerseyImage,
  hustleImage,
}: {
  jerseyImage?: string | null;
  hustleImage?: string | null;
}) {
  const { t } = useLang();

  // Gambar auto: jersi terkini + hustle gear. 1 atau 2 ikut yang di-upload.
  const imgs = [
    jerseyImage ? { src: jerseyImage, label: t("Jersi", "Jersey") } : null,
    hustleImage ? { src: hustleImage, label: "Hustle Gear" } : null,
  ].filter((x): x is { src: string; label: string } => x !== null);

  return (
    <section className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <Reveal>
          <div className="relative overflow-hidden rounded-2xl border border-line bg-bg-soft">
            {/* Cahaya kuning bersinar di sudut */}
            <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-amber/25 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-amber-deep/15 blur-3xl" />

            <div className={`relative grid gap-10 p-8 sm:p-12 ${imgs.length > 0 ? "lg:grid-cols-[1.4fr_1fr] lg:items-center lg:gap-12" : ""}`}>
              {/* Kiri — teks */}
              <div>
                <span className="font-sans text-sm font-semibold uppercase tracking-[0.3em] text-amber">
                  {t("Tempahan 2026", "Order 2026")}
                </span>
                <h2 className="display mt-5 text-5xl text-paper sm:text-6xl">
                  {t("Jersi & Hustle Gear", "Jersey & Hustle Gear")}
                  <br />
                  <span className="text-amber">{t("Kini Dibuka", "Now Open")}</span>
                </h2>
                <p className="mt-6 max-w-lg font-sans text-base leading-relaxed text-muted">
                  {t(
                    "Dari jersi rasmi padang ke training kit Hustle Gear — lengkapkan identiti skuad Stingers Hockey. Pilih reka bentuk, material, saiz, dan cetak nama anda sendiri. Tempah sekarang sebelum kutipan ditutup.",
                    "From the official match jersey to the Hustle Gear training kit — complete your Stingers Hockey squad identity. Pick your design, material, size, and personal name print. Order now before the collection closes."
                  )}
                </p>
                <div className="mt-8">
                  <Button href="/tempahan">{t("Buat Tempahan →", "Place Order →")}</Button>
                </div>
              </div>

              {/* Kanan — visual auto (sembunyi jika tiada gambar) */}
              {imgs.length > 0 && (
                <div className={imgs.length === 2 ? "grid grid-cols-2 gap-3" : ""}>
                  {imgs.map((im) => (
                    <SmartImage
                      key={im.label}
                      src={im.src}
                      alt={`${im.label} Stingers Hockey`}
                      label={im.label}
                      className="aspect-square w-full rounded-xl border border-line"
                      sizes="(max-width: 1024px) 50vw, 20vw"
                      fit="contain"
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
