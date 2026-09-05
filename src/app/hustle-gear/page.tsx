import { permanentRedirect } from "next/navigation";

// Borang lama digantikan oleh Tempahan Pasukan (/tempahan).
//
// `redirect()` mengeluarkan HTTP 307 — sementara. Ia memberitahu enjin carian
// "alamat ini akan kembali", jadi /hustle-gear kekal dalam indeks dan kredit
// mana-mana pautan lama kekal terperangkap padanya. Alamat ini TIDAK akan
// kembali, jadi 308 kekal ialah kebenarannya: kredit pautan berpindah ke
// /tempahan dan alamat lama akhirnya keluar dari indeks.
export default function HustleGearPage() {
  permanentRedirect("/tempahan");
}
