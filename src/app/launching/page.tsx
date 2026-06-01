import type { Metadata } from "next";
import LaunchControls from "@/components/launch/LaunchControls";
import LaunchDeck from "@/components/launch/LaunchDeck";

export const metadata: Metadata = {
  title: "Stingers App — Launching",
  robots: { index: false, follow: false },
};

export default function LaunchingPage() {
  return (
    <div className="min-h-screen bg-ink">
      {/* Print: paparkan deck sahaja, satu slide setiap halaman, kekalkan warna. */}
      <style>{`
        @media print {
          .deck-area, .deck-area * { visibility: visible !important; }
          .deck-area { position: static !important; }
          .slide {
            break-after: page;
            page-break-after: always;
            min-height: 100vh;
          }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          @page { size: A4 portrait; margin: 0; }
        }
      `}</style>
      <LaunchControls />
      <LaunchDeck />
    </div>
  );
}
