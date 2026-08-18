import type { Metadata } from "next";

// Kelulusan allowlist dikuatkuasakan di SERVER (src/lib/portal-guard.ts),
// bukan di sini. Guard klien yang lama boleh dipintas dari DevTools dan
// berjalan SELEPAS komponen server sudah pun menghantar data.
//
// Metadata khusus portal. noindex supaya portal tak muncul di Google.
// ClerkProvider kini di root layout (laman utama pun perlu tahu status login).
export const metadata: Metadata = {
  title: "Portal Ahli — Stingers Hockey",
  robots: { index: false, follow: false },
};

export default function PortalLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-screen bg-ink text-paper">
      {children}
    </div>
  );
}
