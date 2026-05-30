"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import { jerseys } from "@/lib/jerseys";
import SmartImage from "@/components/ui/SmartImage";
import Reveal from "@/components/ui/Reveal";

export default function JerseyGallery() {
  const trackRef = useRef<HTMLDivElement>(null);
  const drag = useRef({ active: false, startX: 0, scrollLeft: 0, moved: false });

  // Drag-to-scroll untuk tetikus (sentuhan dikendalikan oleh scroll natif)
  const onPointerDown = (e: React.PointerEvent) => {
    const el = trackRef.current;
    if (!el) return;
    drag.current = {
      active: true,
      startX: e.clientX,
      scrollLeft: el.scrollLeft,
      moved: false,
    };
    el.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const el = trackRef.current;
    if (!el || !drag.current.active) return;
    const dx = e.clientX - drag.current.startX;
    if (Math.abs(dx) > 4) drag.current.moved = true;
    el.scrollLeft = drag.current.scrollLeft - dx;
  };
  const endDrag = (e: React.PointerEvent) => {
    drag.current.active = false;
    trackRef.current?.releasePointerCapture(e.pointerId);
  };

  return (
    <section id="jersi" className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6">
        {/* Header */}
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Reveal>
              <span className="font-sans text-sm font-semibold uppercase tracking-[0.3em] text-amber">
                Arkib
              </span>
            </Reveal>
            <Reveal delay={0.1}>
              <h2 className="display mt-5 text-5xl text-paper sm:text-6xl lg:text-7xl">
                Legasi Jersi
              </h2>
            </Reveal>
          </div>
          <Reveal delay={0.15}>
            <p className="max-w-sm font-sans text-base text-muted sm:text-right">
              13 edisi sejak 2022 — setiap satu cerita pasukan.
            </p>
          </Reveal>
        </div>
      </div>

      {/* Galeri mendatar */}
      <div
        ref={trackRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        className="scrollbar-amber mt-12 flex cursor-grab snap-x snap-mandatory gap-5 overflow-x-auto px-6 pb-6 active:cursor-grabbing"
      >
        {/* spacer untuk align dengan max-w-7xl container */}
        <div className="shrink-0 lg:w-[max(0px,calc((100vw-80rem)/2))]" aria-hidden />
        {jerseys.map((j) => (
          <motion.article
            key={j.id}
            whileHover={{ y: -8, borderColor: "var(--amber)" }}
            transition={{ type: "spring", stiffness: 300, damping: 24 }}
            className="w-[290px] shrink-0 snap-start overflow-hidden rounded-2xl border border-line bg-bg-soft/60"
            onClickCapture={(e) => {
              // elak buka pautan jika user sebenarnya men-drag
              if (drag.current.moved) e.preventDefault();
            }}
          >
            <SmartImage
              src={j.image}
              alt={`Jersi ${j.name} (${j.year})`}
              label={j.name}
              className="aspect-[3/4] w-full"
              sizes="290px"
              fit="cover"
            />
            <div className="p-5">
              <p className="font-sans text-xs font-semibold uppercase tracking-widest text-amber">
                {[j.tournament, j.year].filter(Boolean).join(" · ")}
              </p>
              <h3 className="display mt-2 text-2xl text-paper">{j.name}</h3>
              {j.note && (
                <p className="mt-1 font-sans text-xs uppercase tracking-wide text-muted">
                  {j.note}
                </p>
              )}
              <p className="mt-2 font-sans text-sm leading-snug text-muted">
                {[j.region, j.venue].filter(Boolean).join(" — ")}
              </p>
            </div>
          </motion.article>
        ))}
        <div className="shrink-0 px-3" aria-hidden />
      </div>
    </section>
  );
}
