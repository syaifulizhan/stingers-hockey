import { kadOg, SAIZ_OG, JENIS_OG } from "@/lib/og";

// Kad kongsi seksyen. Diperlukan secara berasingan kerana halaman ini
// mengeksport blok openGraphnya sendiri, dan itu menghalang gambar
// konvensyen-fail akar daripada disuntik — lihat nota dalam lib/seo.ts.
export const alt = "Tempahan Stingers Hockey";
export const size = SAIZ_OG;
export const contentType = JENIS_OG;

export default async function Image() {
  return kadOg({
    kicker: "Kedai Pasukan",
    tajuk: "Jersi & Hustle Gear",
    perihal: "Tempah jersi hoki rasmi dan Hustle Gear Stingers Hockey.",
  });
}
