"use client";

import { useEffect, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";

// Tarik-untuk-segar-semula (pull-to-refresh) sendiri — berfungsi dalam PWA
// standalone (app dipasang) di mana pull-to-refresh native tiada.
// Tarik ke bawah dari atas halaman → lepas → muat semula (dapat noti/data baru).
const THRESHOLD = 80;

export default function PullToRefresh() {
  const [distance, setDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const pulling = useRef(false);

  useEffect(() => {
    const onStart = (e: TouchEvent) => {
      if (window.scrollY <= 0 && e.touches.length === 1) {
        startY.current = e.touches[0].clientY;
        pulling.current = true;
      }
    };
    const onMove = (e: TouchEvent) => {
      if (!pulling.current) return;
      const dy = e.touches[0].clientY - startY.current;
      if (dy <= 0 || window.scrollY > 0) {
        pulling.current = false;
        setDistance(0);
        return;
      }
      setDistance(Math.min(dy * 0.5, 100)); // rintangan
    };
    const onEnd = () => {
      if (!pulling.current) return;
      pulling.current = false;
      setDistance((d) => {
        if (d >= THRESHOLD) {
          setRefreshing(true);
          setTimeout(() => window.location.reload(), 150);
          return THRESHOLD;
        }
        return 0;
      });
    };

    document.addEventListener("touchstart", onStart, { passive: true });
    document.addEventListener("touchmove", onMove, { passive: true });
    document.addEventListener("touchend", onEnd);
    return () => {
      document.removeEventListener("touchstart", onStart);
      document.removeEventListener("touchmove", onMove);
      document.removeEventListener("touchend", onEnd);
    };
  }, []);

  if (distance === 0 && !refreshing) return null;

  const active = refreshing || distance >= THRESHOLD;
  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[90] flex justify-center"
      style={{ transform: `translateY(${distance}px)` }}
    >
      <div className="mt-3 rounded-full border border-line bg-bg-soft p-2 shadow-lg">
        <RefreshCw
          className={`h-5 w-5 text-amber transition-transform ${active ? "animate-spin" : ""}`}
          style={active ? undefined : { transform: `rotate(${distance * 3}deg)` }}
        />
      </div>
    </div>
  );
}
