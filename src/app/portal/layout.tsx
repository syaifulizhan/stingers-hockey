import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";

// Metadata khusus portal. noindex supaya portal tak muncul di Google.
export const metadata: Metadata = {
  title: "Portal Ahli — Stingers Hockey",
  robots: { index: false, follow: false },
};

// Warna Clerk diselaraskan dengan tema jenama (gelap + amber).
const appearance = {
  variables: {
    colorPrimary: "#f5b400",
    colorBackground: "#0a0a0a",
    colorText: "#f4f1ea",
    colorTextSecondary: "#a3a3a3",
    colorInputBackground: "#141414",
    colorInputText: "#f4f1ea",
    borderRadius: "0.6rem",
  },
};

export default function PortalLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // ClerkProvider diletak DI SINI (bukan root layout) supaya muka public
  // tidak memuatkan apa-apa kod Clerk — kekal sama & laju seperti asal.
  return (
    <ClerkProvider appearance={appearance}>
      <div className="min-h-screen bg-ink text-paper">{children}</div>
    </ClerkProvider>
  );
}
