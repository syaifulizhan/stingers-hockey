"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import PlayerReport from "@/components/portal/PlayerReport";
import type { Report } from "@/lib/report";

export default function ReportToggle({ report }: { report: Report }) {
  const [show, setShow] = useState(false);

  if (!show) {
    return (
      <button
        type="button"
        onClick={() => setShow(true)}
        className="inline-flex items-center gap-2 rounded-full bg-amber px-6 py-3 font-sans text-sm font-semibold uppercase tracking-wider text-ink transition-colors hover:bg-amber-deep"
      >
        <Sparkles className="h-4 w-4" /> Jana Laporan Saya
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <PlayerReport report={report} />
      <button
        type="button"
        onClick={() => setShow(false)}
        className="self-start font-sans text-sm text-muted hover:text-amber"
      >
        Tutup laporan
      </button>
    </div>
  );
}
