"use client";

import { useEffect, useState } from "react";
import { Eye } from "lucide-react";

const INITIAL_VISITORS = 99235;
const STORAGE_KEY = "stingers_visitor_count";

export default function VisitorCounter() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    // Initialize dari localStorage atau set ke initial value
    const stored = localStorage.getItem(STORAGE_KEY);
    const initialCount = stored ? parseInt(stored, 10) : INITIAL_VISITORS;
    setCount(initialCount);

    // Simula pelawat baru setiap 5-15 saat untuk effect yang cantik
    const interval = setInterval(() => {
      setCount((prev) => {
        if (prev === null) return initialCount + 1;
        const newCount = prev + 1;
        localStorage.setItem(STORAGE_KEY, newCount.toString());
        return newCount;
      });
    }, Math.random() * 10000 + 5000); // 5-15 saat

    return () => clearInterval(interval);
  }, []);

  if (count === null) return null;

  return (
    <div className="group inline-flex flex-col items-end gap-1.5">
      <div className="text-xs font-sans text-muted/60 uppercase tracking-wide opacity-0 transition-opacity group-hover:opacity-100">
        {count === INITIAL_VISITORS ? "Live Count" : "Total Views"}
      </div>
      <div className="inline-flex items-center gap-2 rounded-lg border border-amber/20 bg-gradient-to-r from-amber/5 to-amber/10 px-3.5 py-2 text-sm font-mono text-amber/80 backdrop-blur-sm shadow-sm transition-all duration-300 hover:border-amber/40 hover:from-amber/10 hover:to-amber/15 hover:shadow-md hover:shadow-amber/10">
        <Eye className="h-4 w-4 animate-pulse" />
        <span className="tabular-nums font-semibold tracking-tight">{count.toLocaleString("en-US")}</span>
      </div>
    </div>
  );
}
