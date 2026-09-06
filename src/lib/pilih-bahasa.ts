import { istilah, medanPendek } from "@/lib/kamus";

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

/**
 * Pilih teks, kemudian jatuh balik ke kamus istilah sebelum jatuh ke Melayu.
 *
 * Ini UNTUK MEDAN PENDEK BERFORMULA sahaja — keputusan, kejohanan, kategori.
 * Rekod yang belum diterjemah memaparkan "Kejohanan Hoki MSSM 2026" bersebelahan
 * rekod yang sudah memaparkan "MSSM 2026 Hockey Tournament": dinding yang sama,
 * dua bahasa, dan pembaca menyangka salah satunya rosak. Kamus merapatkan jurang
 * itu serta-merta dan tanpa kuota.
 *
 * JANGAN gunakannya pada prosa (cerita, petikan). `medanPendek` ialah pengawal
 * yang menghalangnya: penggantian kata demi kata pada perenggan menghasilkan
 * teks bercampur yang lebih teruk daripada Melayu yang jujur.
 */
export function pilihIstilah(
  lang: string,
  asal: string | null | undefined,
  terjemahan: { en?: Record<string, string> } | null | undefined,
  medan: string,
): string {
  const hasil = pilih(lang, asal, terjemahan, medan);
  // Terjemahan tersimpan sentiasa menang; kamus hanya masuk bila tiada.
  if (lang !== "en" || hasil !== (asal ?? "")) return hasil;
  return medanPendek(hasil) ? istilah(hasil, lang) : hasil;
}
