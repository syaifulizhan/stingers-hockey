import { kadOg, SAIZ_OG, JENIS_OG } from "@/lib/og";

// Kad kongsi lalai. Setiap halaman tanpa kadnya sendiri mewarisi yang ini,
// jadi tiada pautan hoki.my yang pernah dikongsi tanpa gambar lagi.
export const alt = "Stingers Hockey — Pasukan hoki rasmi SK Taman Desaminium";
export const size = SAIZ_OG;
export const contentType = JENIS_OG;

export default async function Image() {
  return kadOg({
    kicker: "SK Taman Desaminium · Seri Kembangan",
    tajuk: "Strike Hard. Strike Fast.",
    perihal: "Pasukan hoki rasmi SK Taman Desaminium sejak 2017.",
  });
}
