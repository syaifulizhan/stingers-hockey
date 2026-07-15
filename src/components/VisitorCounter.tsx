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
    <div className="group inline-flex flex-col items-end gap-2">
      <div className="text-xs font-sans font-semibold text-amber/70 uppercase tracking-widest">
        {t("Pelawat", "Visitors")}
      </div>
      <div className="inline-flex items-center gap-2.5 rounded-lg border border-amber/30 bg-gradient-to-br from-amber/10 via-amber/5 to-transparent px-4 py-2.5 text-sm font-mono text-amber/90 backdrop-blur-sm shadow-lg shadow-amber/10 transition-all duration-300 hover:border-amber/50 hover:shadow-xl hover:shadow-amber/20">
        <Eye className="h-5 w-5 flex-shrink-0 text-amber/80 animate-pulse" aria-hidden="true" />
        <span className="tabular-nums font-bold tracking-tight">{count.toLocaleString("en-US")}</span>
      </div>
    </div>
  );
}
