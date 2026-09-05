import type { Metadata, Viewport } from "next";
import { Anton, Archivo } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";
import ServiceWorker from "@/components/ServiceWorker";
import InstallPrompt from "@/components/InstallPrompt";
import SplashScreen from "@/components/SplashScreen";
import PullToRefresh from "@/components/PullToRefresh";
import LogoutRefresh from "@/components/portal/LogoutRefresh";
import { LanguageProvider } from "@/lib/i18n";
import JsonLd from "@/components/JsonLd";
import { SITE_URL, SITE_NAME } from "@/lib/seo";
import { graf, pasukanSchema, sekolahSchema, websiteSchema } from "@/lib/jsonld";

// Tema Clerk (gelap + amber) — dikongsi laman utama & portal.
const clerkAppearance = {
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

// Display font — bold, condensed, sporty headlines
const anton = Anton({
  variable: "--font-anton",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

// Body font — clean, editorial sans-serif
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: SITE_NAME,
  manifest: "/manifest.webmanifest",
  // Alamat kanonik. Tiada satu pun halaman mengeluarkan tag ini sebelum ini,
  // jadi setiap alamat pendua — domain .vercel.app, pautan yang membawa
  // ?utm_source=, ?fbclid= dari perkongsian Facebook — kelihatan kepada Google
  // sebagai halaman berasingan yang bersaing dengan yang asal. Nilai relatif
  // diselesaikan terhadap metadataBase, dan setiap halaman menimpanya dengan
  // alamatnya sendiri.
  alternates: {
    canonical: "/",
    types: { "application/rss+xml": `${SITE_URL}/berita/rss.xml` },
  },
  // Benarkan pratonton gambar besar dan cuplikan penuh. Tanpa ini Google
  // lalai kepada lakaran kecil — dan laman ini ialah laman gambar: jersi,
  // pemain, kad Hall of Honour.
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  // 59 aksara. Versi sebelum ini 66 — Google memotong sekitar 60, jadi
  // "| Hoki.my" tidak pernah kelihatan dalam hasil carian.
  title: "Stingers Hockey — Pasukan Hoki SK Taman Desaminium",
  // 152 aksara; Google memotong sekitar 155.
  description:
    "Pasukan hoki rasmi SK Taman Desaminium, Seri Kembangan. Strike Hard. Strike Fast. Sertai pencarian bakat 2026 — latihan, jersi dan berita hoki terkini.",
  verification: {
    google: "scHV8-Ztac4CjvRJp4_cUIhsWbFl6i-yaVvi7H-jiH8",
  },
  icons: {
    icon: [{ url: "/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Stingers",
  },
  keywords: [
    "hoki",
    "hoki malaysia",
    "hoki.my",
    "Stingers Hockey",
    "field hockey Malaysia",
    "hoki sekolah",
    "SK Taman Desaminium",
    "hoki sekolah Selangor",
    "pasukan hoki Seri Kembangan",
    "kejohanan hoki",
  ],
  authors: [{ name: SITE_NAME }],
  openGraph: {
    type: "website",
    locale: "ms_MY",
    siteName: SITE_NAME,
    title: "Stingers Hockey — Pasukan Hoki Rasmi SK Taman Desaminium",
    description:
      "Strike Hard. Strike Fast. Pasukan hoki rasmi SK Taman Desaminium sejak 2017. Sertai pencarian bakat 2026.",
    url: SITE_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: "Stingers Hockey — SK Taman Desaminium",
    description: "Strike Hard. Strike Fast. Sertai pencarian bakat 2026.",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

// Structured data peringkat laman — perkara yang benar pada SETIAP halaman.
// Breadcrumb dan schema khusus halaman (Article, Person, FAQ) tinggal di
// halaman masing-masing, di mana ia benar-benar menerangkan sesuatu.
//
// FAQPage dahulunya berada di sini, jadi ia disajikan pada /tempahan, /live
// dan /keputusan — halaman yang tidak memaparkan satu pun soalan itu. Garis
// panduan Google ialah markup FAQ mesti sepadan dengan FAQ yang KELIHATAN
// pada halaman itu. Ia kini berada di laman utama sahaja, di mana jawapannya
// benar-benar dipaparkan.
const grafLaman = graf(pasukanSchema, sekolahSchema, websiteSchema);

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // ClerkProvider di root → laman utama & portal sama-sama tahu status login.
    <ClerkProvider appearance={clerkAppearance} afterSignOutUrl="/">
      <html
        lang="ms"
        suppressHydrationWarning
        className={`${anton.variable} ${archivo.variable} h-full antialiased`}
      >
        <body className="min-h-full flex flex-col bg-ink text-paper">
          <JsonLd json={grafLaman} />
          <LanguageProvider>{children}</LanguageProvider>
          <PullToRefresh />
          <LogoutRefresh />
          <SplashScreen />
          <ServiceWorker />
          <InstallPrompt />
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  );
}
