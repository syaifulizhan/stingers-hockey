"use client";

import { Dot } from "lucide-react";
import Card from "@/components/ui/Card";
import Reveal from "@/components/ui/Reveal";

const sessions = [
  {
    no: "01",
    days: "Selasa & Rabu",
    squad: "Lelaki",
    time: "7.30 pagi – 9.30 pagi",
  },
  {
    no: "02",
    days: "Khamis & Jumaat",
    squad: "Perempuan",
    time: "7.30 pagi – 9.30 pagi",
  },
];

const chips = [
  "Jurulatih akan menilai prestasi anda di padang",
  "Pemain terpilih dijemput sertai skuad 2026",
];

export default function Training() {
  return (
    <section id="latihan" className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6">
        {/* Header */}
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Reveal>
              <span className="font-sans text-sm font-semibold uppercase tracking-[0.3em] text-amber">
                Jadual Latihan
              </span>
            </Reveal>
            <Reveal delay={0.1}>
              <h2 className="display mt-5 text-5xl text-paper sm:text-6xl lg:text-7xl">
                Padang Menanti
              </h2>
            </Reveal>
          </div>
          <Reveal delay={0.15}>
            <p className="max-w-sm font-sans text-base text-muted sm:text-right">
              Multipurpose Court, SK Taman Desaminium. Sedia berkasut, tenaga &
              semangat juang.
            </p>
          </Reveal>
        </div>

        {/* 2 kad besar */}
        <div className="mt-14 grid gap-6 md:grid-cols-2">
          {sessions.map((s, i) => (
            <Reveal key={s.no} delay={i * 0.1}>
              <Card className="flex h-full flex-col gap-6 p-8 sm:p-10">
                <span className="display text-7xl text-outline sm:text-8xl">
                  {s.no}
                </span>
                <div>
                  <p className="font-sans text-sm font-semibold uppercase tracking-widest text-amber">
                    {s.days}
                  </p>
                  <h3 className="display mt-2 text-4xl text-paper sm:text-5xl">
                    {s.squad}
                  </h3>
                  <p className="mt-3 font-sans text-base text-muted">{s.time}</p>
                </div>
              </Card>
            </Reveal>
          ))}
        </div>

        {/* Chips */}
        <div className="mt-8 flex flex-col gap-4 sm:flex-row">
          {chips.map((chip) => (
            <Reveal key={chip} className="flex-1">
              <div className="flex items-center gap-2 rounded-full border border-line bg-bg-soft/60 px-5 py-3">
                <Dot className="h-6 w-6 shrink-0 text-amber" strokeWidth={6} />
                <span className="font-sans text-sm text-paper/85">{chip}</span>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
