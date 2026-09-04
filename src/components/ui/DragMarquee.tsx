"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

// ============================================================================
// Jalur mendatar yang menghanyut perlahan, berhenti bila disentuh, dan boleh
// ditolak dengan tetikus, jari, atau swipe dua jari trackpad.
//
// Digerakkan oleh transform + rAF, bukan animasi CSS — animasi CSS tidak boleh
// dipintas oleh tangan pengguna di tengah jalan.
// ============================================================================

const MAX_FLING = 1600;

export default function DragMarquee({
  items,
  speed = 22,
  gap = 16,
  className = "",
  label,
}: {
  items: ReactNode[];
  /** Piksel sesaat. Lebih kecil = lebih tenang. */
  speed?: number;
  gap?: number;
  className?: string;
  label?: string;
}) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLUListElement>(null);

  const offset = useRef(0);
  const copyW = useRef(0);
  const paused = useRef(false);
  const visible = useRef(true);
  const velocity = useRef(0);
  const wheelIdleAt = useRef(0);
  const drag = useRef({
    active: false,
    startX: 0,
    lastX: 0,
    lastT: 0,
    moved: false,
    captured: false,
    id: -1,
  });

  const [copies, setCopies] = useState(2);

  const wrap = useCallback(() => {
    const w = copyW.current;
    if (w <= 0) return;
    offset.current = ((offset.current % w) - w) % w;
    if (offset.current === -w) offset.current = 0;
  }, []);

  const apply = useCallback(() => {
    const el = trackRef.current;
    if (el) el.style.transform = `translate3d(${offset.current}px, 0, 0)`;
  }, []);

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
  }, [items, wrap, apply]);

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
          offset.current += velocity.current * dt;
          velocity.current *= Math.exp(-dt * 3.2);
          wrap();
          apply();
        } else if (!paused.current && !reduced && now >= wheelIdleAt.current) {
          velocity.current = 0;
          offset.current -= speed * dt;
          wrap();
          apply();
        }
      }

      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [wrap, apply, speed]);

  // Swipe dua jari trackpad. React melekatkan `wheel` secara passive, jadi
  // listener native diperlukan untuk preventDefault.
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      e.preventDefault();
      const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? el.clientWidth : 1;
      offset.current -= e.deltaX * unit;
      velocity.current = 0;
      wheelIdleAt.current = performance.now() + 700;
      wrap();
      apply();
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [wrap, apply]);

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
    // Pointer capture ditangguh: kalau ditangkap awal, `click` pergi ke bekas
    // ini, bukan ke pautan di dalamnya.
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
    if (dt > 0) velocity.current = velocity.current * 0.7 + (dx / dt) * 0.3;
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

  const onClickCapture = (e: React.MouseEvent) => {
    if (drag.current.moved) {
      e.preventDefault();
      e.stopPropagation();
      drag.current.moved = false;
    }
  };

  return (
    <div
      ref={viewportRef}
      aria-label={label}
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
      className={`cursor-grab overflow-hidden overscroll-x-contain [mask-image:linear-gradient(to_right,transparent,#000_5%,#000_95%,transparent)] [touch-action:pan-y] active:cursor-grabbing ${className}`}
    >
      <div ref={trackRef} className="flex w-max select-none will-change-transform">
        {Array.from({ length: copies }, (_, c) => (
          <ul
            key={c}
            ref={c === 0 ? copyRef : undefined}
            inert={c > 0}
            className="flex shrink-0 items-stretch"
            style={{ gap, paddingRight: gap }}
          >
            {items.map((item, i) => (
              <li key={`${c}-${i}`} className="flex">
                {item}
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  );
}
