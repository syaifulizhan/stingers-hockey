"use client";

import { useEffect, useState } from "react";
import { Eye } from "lucide-react";
import { useLang } from "@/lib/i18n";

const INITIAL_VISITORS = 99235;

export default function VisitorCounter() {
  const { t } = useLang();
  const [count, setCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function initializeVisitor() {
      try {
        const response = await fetch("/api/visitors");
        const data = await response.json();
        setCount(data.count ?? INITIAL_VISITORS);

        await fetch("/api/visitors", { method: "POST" });
      } catch (error) {
        console.error("Failed to fetch visitor count:", error);
        setCount(INITIAL_VISITORS);
      } finally {
        setIsLoading(false);
      }
    }

    initializeVisitor();
  }, []);

  useEffect(() => {
    if (count === null) return;

    const interval = setInterval(async () => {
      try {
        const response = await fetch("/api/visitors");
        const data = await response.json();
        setCount(data.count ?? count);
      } catch (error) {
        console.error("Failed to refresh visitor count:", error);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [count]);

  if (isLoading || count === null) return null;

  return (
    <div className="group inline-flex flex-col items-end gap-2.5">
      <div className="text-xs font-sans font-bold text-amber uppercase tracking-widest leading-none">
        {t("Pelawat", "Visitors")}
      </div>
      <div className="inline-flex items-center gap-3 rounded-xl border-2 border-amber/50 bg-gradient-to-br from-amber/15 via-amber/5 to-amber/0 px-5 py-3 text-base font-mono text-amber/95 backdrop-blur-md shadow-2xl shadow-amber/20 transition-all duration-300 hover:border-amber/70 hover:from-amber/20 hover:via-amber/10 hover:shadow-amber/30 ring-1 ring-amber/20">
        <Eye className="h-6 w-6 flex-shrink-0 text-amber/80 animate-pulse drop-shadow-lg" aria-hidden="true" />
        <span className="tabular-nums font-bold tracking-tighter text-lg">{count.toLocaleString("en-US")}</span>
      </div>
    </div>
  );
}
