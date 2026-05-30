import type { MetadataRoute } from "next";

// Web App Manifest — membolehkan laman "dipasang" ke skrin utama telefon
// dan dibuka skrin penuh (standalone) seperti aplikasi.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Stingers Hockey",
    short_name: "Stingers",
    description:
      "Pasukan hoki rasmi SK Taman Desaminium. Pendaftaran & tempahan Hustle Gear.",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0a0a0a",
    theme_color: "#0a0a0a",
    lang: "ms",
    categories: ["sports"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Tempah Hustle Gear",
        short_name: "Tempahan",
        url: "/hustle-gear",
      },
      {
        name: "Daftar Pemain",
        short_name: "Daftar",
        url: "/#daftar",
      },
    ],
  };
}
