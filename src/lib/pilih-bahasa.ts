// Pilih teks mengikut bahasa semasa, dengan jatuh balik ke Melayu.
//
// Peraturannya satu baris dan ia penting: apabila terjemahan tiada, kita
// memaparkan teks Melayu asal. TIDAK PERNAH rentetan kosong. Pembaca Inggeris
// yang menemui satu perenggan Melayu masih boleh membacanya atau
// menterjemahnya sendiri; pembaca yang menemui ruang kosong tidak boleh
// berbuat apa-apa.
export function pilih(
  lang: string,
  asal: string | null | undefined,
  terjemahan: { en?: Record<string, string> } | null | undefined,
  medan: string,
): string {
  if (lang === "en") {
    const en = terjemahan?.en?.[medan];
    if (en && en.trim()) return en;
  }
  return asal ?? "";
}
