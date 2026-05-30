import type { Metadata, Viewport } from "next";
import { Anton, Archivo } from "next/font/google";
import "./globals.css";

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

const SITE_URL = "https://stingers-hockey.vercel.app"; // TODO: tukar ke domain sebenar bila deploy

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Stingers Hockey — Pasukan Hoki Rasmi SK Taman Desaminium",
  description:
    "Strike Hard. Strike Fast. Pasukan hoki rasmi Sekolah Kebangsaan Taman Desaminium sejak 2017. Sertai pencarian bakat Stingers Hockey 2026.",
  keywords: [
    "Stingers Hockey",
    "field hockey Malaysia",
    "SK Taman Desaminium",
    "hoki sekolah Selangor",
    "pasukan hoki Seri Kembangan",
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
};

// JSON-LD structured data — SportsTeam schema
const jsonLd = {
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ms"
      className={`${anton.variable} ${archivo.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-ink text-paper">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
      </body>
    </html>
  );
}
