"use client";

import Link from "next/link";
import { Printer, ArrowLeft } from "lucide-react";

export default function LaunchControls() {
  return (
    <div className="no-print sticky top-0 z-50 flex items-center justify-between border-b border-line bg-ink/95 px-6 py-3 backdrop-blur">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 font-sans text-sm text-muted transition-colors hover:text-amber"
      >
        <ArrowLeft className="h-4 w-4" /> Laman Utama
      </Link>
      <span className="font-sans text-xs text-muted">
        Tip: aktifkan “Background graphics” dalam dialog cetak
      </span>
      <button
        type="button"
        onClick={() => window.print()}
        className="inline-flex items-center gap-2 rounded-full bg-amber px-5 py-2 font-sans text-sm font-semibold uppercase tracking-wider text-ink transition-colors hover:bg-amber-deep"
      >
        <Printer className="h-4 w-4" /> Cetak / PDF
      </button>
    </div>
  );
}
