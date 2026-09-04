"use client";

import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import Reveal from "@/components/ui/Reveal";
import { useLang } from "@/lib/i18n";
import SmartImg from "@/components/SmartImg";

type NewsRow = {
  id: string;
  title: string;
  body: string | null;
  image_url: string | null;
  published_at: string;
  slug: string | null;
};

// Kelajuan hanyut automatik (piksel/saat) — sengaja lebih perlahan dari Marquee atas.
const SPEED = 22;
// Had halaju lontaran selepas jari/tetikus dilepas.
const MAX_FLING = 1600;

export default function BeritaView({ news }: { news: NewsRow[] }) {
  const { lang, t } = useLang();
  const locale = lang === "en" ? "en-MY" : "ms-MY";

  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLUListElement>(null);

  // Semua keadaan animasi disimpan dalam ref supaya tiada re-render setiap frame.
  const offset = useRef(0); // kedudukan semasa track (px, negatif = ke kiri)
  const copyW = useRef(0); // lebar satu salinan senarai
  const paused = useRef(false); // hover / fokus papan kekunci
  const visible = useRef(true); // seksyen dalam viewport?
  const velocity = useRef(0); // baki halaju selepas lontaran
  const drag = useRef({
    active: false,
    startX: 0,
    lastX: 0,
    lastT: 0,
    moved: false,
    captured: false,
    id: -1,
  });

  // Bilangan salinan senarai — cukup untuk menutup lebar skrin tanpa celah.
  const [copies, setCopies] = useState(2);

  const wrap = useCallback(() => {
    const w = copyW.current;
    if (w <= 0) return;
    // Kekalkan offset dalam julat (-w, 0] supaya gelung nampak tiada sambungan.
    offset.current = ((offset.current % w) - w) % w;
    if (offset.current === -w) offset.current = 0;
  }, []);

  const apply = useCallback(() => {
    const el = trackRef.current;
    if (el) el.style.transform = `translate3d(${offset.current}px, 0, 0)`;
  }, []);

  // Ukur lebar satu salinan; kira berapa salinan diperlukan.
  useLayoutEffect(() => {
    const copy = copyRef.current;
    const viewport = viewportRef.current;
    if (!copy || !viewport) return;

    const measure = () => {
      const w = copy.getBoundingClientRect().width;
      if (w > 0) copyW.current = w;
      const need = w > 0 ? Math.ceil(viewport.clientWidth / w) + 1 : 2;
      setCopies(Math.max(2, need));
      wrap();
      apply();
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(copy);
    ro.observe(viewport);
    return () => ro.disconnect();
  }, [news, wrap, apply]);

  // Jangan bakar frame bila seksyen di luar skrin.
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        visible.current = entry.isIntersecting;
      },
      { rootMargin: "100px" },
    );
    io.observe(viewport);
    return () => io.disconnect();
  }, []);

  // Gelung animasi: hanyut perlahan, atau reda selepas lontaran.
  useEffect(() => {
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let raf = 0;
    let last = performance.now();

    const frame = (now: number) => {
      const dt = Math.min(now - last, 64) / 1000;
      last = now;

      if (copyW.current > 0 && visible.current && !drag.current.active) {
        if (Math.abs(velocity.current) > 2) {
          // Lontaran: geser mengikut halaju, kemudian reda.
          offset.current += velocity.current * dt;
          velocity.current *= Math.exp(-dt * 3.2);
          wrap();
          apply();
        } else if (!paused.current && !reduced) {
          velocity.current = 0;
          offset.current -= SPEED * dt;
          wrap();
          apply();
        }
      }

      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [wrap, apply]);

  // --- Tarik dengan tetikus / jari -------------------------------------
  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    drag.current = {
      active: true,
      startX: e.clientX,
      lastX: e.clientX,
      lastT: e.timeStamp,
      moved: false,
      captured: false,
      id: e.pointerId,
    };
    velocity.current = 0;
    // Sengaja belum setPointerCapture: kalau ditangkap awal, event `click`
    // akan pergi ke bekas ini, bukan ke pautan kad. Tangkap hanya bila menggeser.
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d.active || e.pointerId !== d.id) return;
    const dx = e.clientX - d.lastX;
    const dt = (e.timeStamp - d.lastT) / 1000;
    if (Math.abs(e.clientX - d.startX) > 4 && !d.moved) {
      d.moved = true;
      d.captured = true;
      viewportRef.current?.setPointerCapture(e.pointerId);
    }
    d.lastX = e.clientX;
    d.lastT = e.timeStamp;
    if (dt > 0) {
      // Halaju dilicinkan supaya lontaran tidak melompat.
      velocity.current = velocity.current * 0.7 + (dx / dt) * 0.3;
    }
    offset.current += dx;
    wrap();
    apply();
  };

  const endDrag = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d.active || e.pointerId !== d.id) return;
    d.active = false;
    velocity.current = Math.max(-MAX_FLING, Math.min(MAX_FLING, velocity.current));
    if (d.captured && viewportRef.current?.hasPointerCapture(e.pointerId)) {
      viewportRef.current.releasePointerCapture(e.pointerId);
    }
    d.captured = false;
  };

  // Tarik ≠ klik: halang navigasi bila jari/tetikus sebenarnya menggeser.
  const onClickCapture = (e: React.MouseEvent) => {
    if (drag.current.moved) {
      e.preventDefault();
      e.stopPropagation();
      drag.current.moved = false;
    }
  };

  const card = (n: NewsRow) => (
    <Link
      href={`/berita/${n.slug ?? n.id}`}
      draggable={false}
      className="group flex h-full w-[220px] shrink-0 flex-col overflow-hidden rounded-xl border border-line bg-bg-soft transition-colors hover:border-amber/60 sm:w-[240px]"
    >
      {n.image_url ? (
        <SmartImg
          src={n.image_url}
          alt={n.title}
          draggable={false}
          className="aspect-video w-full object-cover"
        />
      ) : (
        <div className="aspect-video w-full bg-ink" />
      )}
      <div className="flex flex-1 flex-col p-4">
        <p className="font-sans text-[11px] uppercase tracking-wider text-muted">
          {new Date(n.published_at).toLocaleDateString(locale, {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
        <h3 className="mt-1.5 line-clamp-2 font-sans text-sm font-semibold leading-snug text-paper">
          {n.title}
        </h3>
        {n.body && (
          <p className="mt-1.5 line-clamp-2 font-sans text-xs leading-relaxed text-muted">
            {n.body}
          </p>
        )}
        <span className="mt-3 font-sans text-xs font-semibold text-amber">
          {t("Baca lagi →", "Read more →")}
        </span>
      </div>
    </Link>
  );

  return (
    <section id="berita" className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <Reveal>
          <span className="font-sans text-sm font-semibold uppercase tracking-[0.3em] text-amber">
            {t("Berita Terkini", "Latest News")}
          </span>
        </Reveal>
        <Reveal delay={0.1}>
          <h2 className="display mt-5 text-5xl text-paper sm:text-6xl">
            {t("Apa Yang", "What's")} <span className="text-amber">{t("Terjadi", "Happening")}</span>
          </h2>
        </Reveal>
      </div>

      {/* Jalur berita: hanyut perlahan, henti bila disentuh, boleh ditarik. */}
      <Reveal delay={0.15}>
        <div
          ref={viewportRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onClickCapture={onClickCapture}
          onPointerEnter={(e) => {
            if (e.pointerType !== "touch") paused.current = true;
          }}
          onPointerLeave={(e) => {
            if (e.pointerType !== "touch") paused.current = false;
          }}
          onFocusCapture={() => {
            paused.current = true;
          }}
          onBlurCapture={() => {
            paused.current = false;
          }}
          className="mt-10 cursor-grab overflow-hidden [mask-image:linear-gradient(to_right,transparent,#000_5%,#000_95%,transparent)] [touch-action:pan-y] active:cursor-grabbing"
        >
          <div ref={trackRef} className="flex w-max select-none will-change-transform">
            {Array.from({ length: copies }, (_, c) => (
              <ul
                key={c}
                ref={c === 0 ? copyRef : undefined}
                inert={c > 0}
                className="flex shrink-0 items-stretch gap-4 pr-4"
              >
                {news.map((n) => (
                  <li key={`${c}-${n.id}`} className="flex">
                    {card(n)}
                  </li>
                ))}
              </ul>
            ))}
          </div>
        </div>
      </Reveal>

      <div className="mx-auto max-w-7xl px-6">
        <Reveal delay={0.3}>
          <div className="mt-10 text-center">
            <Link
              href="/berita"
              className="inline-block rounded-full border border-amber px-7 py-3 font-sans text-sm font-semibold uppercase tracking-wider text-amber transition-colors hover:bg-amber hover:text-ink"
            >
              {t("Lihat Semua Berita →", "View All News →")}
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
