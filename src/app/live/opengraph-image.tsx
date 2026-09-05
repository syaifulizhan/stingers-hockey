import { kadOg, SAIZ_OG, JENIS_OG } from "@/lib/og";

// Kad kongsi seksyen. Diperlukan secara berasingan kerana halaman ini
// mengeksport blok openGraphnya sendiri, dan itu menghalang gambar
// konvensyen-fail akar daripada disuntik — lihat nota dalam lib/seo.ts.
export const alt = "Live Stingers Hockey";
export const size = SAIZ_OG;
export const contentType = JENIS_OG;

export default async function Image() {
  return kadOg({
    kicker: "Langsung",
    tajuk: "Perlawanan & Keputusan",
    perihal: "Keputusan terkini dan rumusan musim pasukan Stingers Hockey.",
  });
}
