"use client";

import Link from "next/link";
import { Printer, ArrowLeft } from "lucide-react";

export default function PrintBar() {
  return (
    <div className="no-print mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
      <Link
        href="/portal/dashboard"
        className="inline-flex items-center gap-1.5 font-sans text-sm text-muted transition-colors hover:text-amber"
      >
        <ArrowLeft className="h-4 w-4" /> Kembali
      </Link>
      <button
        type="button"
        onClick={() => window.print()}
        className="inline-flex items-center gap-2 rounded-full bg-amber px-6 py-2.5 font-sans text-sm font-semibold uppercase tracking-wider text-ink transition-colors hover:bg-amber-deep"
      >
        <Printer className="h-4 w-4" /> Cetak / Simpan PDF
      </button>
    </div>
  );
}
