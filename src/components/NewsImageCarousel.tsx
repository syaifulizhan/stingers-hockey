"use client";

import { useEffect, useRef, useState } from "react";

export default function NewsImageCarousel({
  images,
  title,
}: {
  images: string[];
  title: string;
}) {
  const [active, setActive] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);

  // Kesan slaid aktif berdasarkan offsetLeft terdekat dengan scrollLeft.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const onScroll = () => {
      const slides = track.querySelectorAll<HTMLElement>("[data-slide]");
      let closest = 0;
      let minDist = Infinity;
      slides.forEach((slide) => {
        const dist = Math.abs(slide.offsetLeft - track.scrollLeft);
        if (dist < minDist) { minDist = dist; closest = Number(slide.dataset.slide); }
      });
      setActive(closest);
    };
    track.addEventListener("scroll", onScroll, { passive: true });
    return () => track.removeEventListener("scroll", onScroll);
  }, []);

  const goTo = (idx: number) => {
    const track = trackRef.current;
    const slide = track?.querySelector<HTMLElement>(`[data-slide="${idx}"]`);
    if (slide && track) track.scrollTo({ left: slide.offsetLeft, behavior: "smooth" });
  };

  // Satu gambar — papar biasa tanpa carousel.
  if (images.length <= 1) {
    return images[0] ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={images[0]}
        alt={title}
        className="mt-6 w-full rounded-2xl border border-line object-cover"
      />
    ) : null;
  }

  return (
    <div className="mt-6 select-none">
      {/* Track — setiap slaid 90% lebar supaya 10% gambar seterusnya nampak */}
      <div
        ref={trackRef}
        className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto gap-2"
      >
        {images.map((src, i) => (
          <div
            key={src}
            data-slide={i}
            className="w-[90%] shrink-0 snap-start"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={`${title} — ${i + 1}/${images.length}`}
              draggable={false}
              className="aspect-video w-full rounded-2xl border border-line object-cover"
            />
          </div>
        ))}
        {/* Spacer 10% supaya slaid terakhir boleh snap ke tepi kiri */}
        <div className="w-[10%] shrink-0" aria-hidden="true" />
      </div>

      {/* Dots indicator */}
      <div className="mt-3 flex items-center justify-center gap-1.5">
        {images.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => goTo(i)}
            aria-label={`Gambar ${i + 1}`}
            className={`rounded-full transition-all duration-300 ease-out ${
              i === active
                ? "h-1.5 w-6 bg-amber"
                : "h-1.5 w-1.5 bg-paper/30 hover:bg-paper/50"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
