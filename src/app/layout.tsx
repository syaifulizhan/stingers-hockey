import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: "Stingers Hockey — SK Taman Desaminium",
  description:
    "Laman rasmi Stingers Hockey, pasukan field hockey SK Taman Desaminium, Seri Kembangan.",
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
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
