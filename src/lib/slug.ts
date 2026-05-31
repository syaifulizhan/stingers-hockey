// Jana slug URL dari tajuk: maksimum 3 perkataan, huruf kecil, sempang.
// Contoh: "Stingers Menang Kejohanan MSSD" → "stingers-menang-kejohanan".
export function makeSlug(title: string): string {
  const base = title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\s-]/g, "") // buang simbol/aksen
    .trim()
    .split(/\s+/)
    .slice(0, 3)
    .join("-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return base || "berita";
}
