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
import { faqSchema, organizationSchema } from "@/lib/schema";

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

const SITE_URL = process.env.NODE_ENV === "production"
  ? "https://hoki.my"
  : "https://stingers-hockey-r99l.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: "Stingers Hockey",
  manifest: "/manifest.webmanifest",
  title: "Stingers Hockey — Pasukan Hoki Rasmi SK Taman Desaminium | Hoki.my",
  description:
    "Hoki.my — Pasukan hoki rasmi SK Taman Desaminium. Strike Hard. Strike Fast. Sertai pencarian bakat Stingers Hockey 2026. Latihan, jersi, dan berita hoki terkini.",
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
  authors: [{ name: "Stingers Hockey" }],
  openGraph: {
    type: "website",
    locale: "ms_MY",
    siteName: "Stingers Hockey",
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

// JSON-LD structured data — Multiple schemas for better SEO
const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "SportsTeam",
    name: "Stingers Hockey",
    sport: "Field Hockey",
    foundingDate: "2017",
    slogan: "Strike Hard. Strike Fast.",
    url: SITE_URL,
    email: "hstingers@gmail.com",
    telephone: "+60389413905",
    memberOf: {
      "@type": "EducationalOrganization",
      name: "Sekolah Kebangsaan Taman Desaminium",
    },
    location: {
      "@type": "Place",
      name: "SK Taman Desaminium",
      address: {
        "@type": "PostalAddress",
        streetAddress: "Persiaran Desaminium 1, Taman Desaminium",
        addressLocality: "Seri Kembangan",
        postalCode: "43300",
        addressRegion: "Selangor",
        addressCountry: "MY",
      },
    },
  },
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Hoki.my",
        item: SITE_URL,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Berita",
        item: `${SITE_URL}/berita`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: "Live",
        item: `${SITE_URL}/live`,
      },
    ],
  },
  faqSchema,
  organizationSchema,
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Stingers Hockey",
    url: SITE_URL,
    searchAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
      },
    },
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/berita?search={search_term_string}`,
    },
  },
];

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
          {/* JSON-LD (data, bukan skrip boleh-laku) — corak rasmi Next App Router. */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@graph": jsonLd }) }}
          />
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
