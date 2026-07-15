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
    <div className="group inline-flex flex-col items-end gap-1.5">
      <div className="text-xs font-sans text-muted/60 uppercase tracking-wide opacity-0 transition-opacity group-hover:opacity-100">
        {t("Pelawat", "Visitors")}
      </div>
      <div className="inline-flex items-center gap-2 rounded-lg border border-amber/20 bg-gradient-to-r from-amber/5 to-amber/10 px-3.5 py-2 text-sm font-mono text-amber/80 backdrop-blur-sm shadow-sm transition-all duration-300 hover:border-amber/40 hover:from-amber/10 hover:to-amber/15 hover:shadow-md hover:shadow-amber/10">
        <Eye className="h-4 w-4 animate-pulse" />
        <span className="tabular-nums font-semibold tracking-tight">{count.toLocaleString("en-US")}</span>
      </div>
    </div>
  );
}
