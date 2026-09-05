import "server-only";
import { after } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { terjemahBerita, terjemahLegasi } from "@/lib/terjemah-rekod";

// ============================================================================
// Terjemah dan simpan, selepas balasan dihantar.
//
// Sama seperti IndexNow: `after()` menjalankan kerja ini apabila jurulatih
// sudah pun melihat beritanya tersiar. Artikel panjang mengambil lapan hingga
// sepuluh saat untuk diterjemah, dan tiada sebab sesiapa perlu memandang
// skrin memuat selama itu.
//
// Kegagalan diam-diam DENGAN SENGAJA. Jika perkhidmatan terjemahan tidak
// menjawab, rekod itu kekal tanpa blok Inggerisnya dan halaman jatuh balik ke
// bahasa Melayu. Berita yang tersiar dalam satu bahasa jauh lebih baik
// daripada penerbitan yang gagal kerana pelayan pihak ketiga sedang tumbang.
// ============================================================================

export function simpanTerjemahanBerita(
  id: string,
  news: { title: string; body: string | null },
): void {
  after(async () => {
    try {
      const terjemahan = await terjemahBerita(news);
      if (!terjemahan) {
        console.warn(`[terjemah] berita ${id}: tiada hasil, kekal BM sahaja.`);
        return;
      }
      const supabase = await createServerSupabase();
      const { error } = await supabase
        .from("news")
        .update({ translations: terjemahan })
        .eq("id", id);
      if (error) {
        console.error("[terjemah] gagal simpan berita:", error.message);
        return;
      }
      // Halaman perlu dibina semula, jika tidak versi Inggeris hanya muncul
      // apabila cache tamat tempoh dengan sendirinya.
      revalidatePath("/");
      revalidatePath("/berita");
      console.log(`[terjemah] berita ${id} diterjemah.`);
    } catch (err) {
      console.error("[terjemah] berita gagal:", err);
    }
  });
}

export function simpanTerjemahanLegasi(
  id: string,
  slug: string,
  r: Parameters<typeof terjemahLegasi>[0],
): void {
  after(async () => {
    try {
      const terjemahan = await terjemahLegasi(r);
      if (!terjemahan) {
        console.warn(`[terjemah] legasi ${slug}: tiada hasil, kekal BM sahaja.`);
        return;
      }
      const supabase = await createServerSupabase();
      const { error } = await supabase
        .from("legacy_records")
        .update({ translations: terjemahan })
        .eq("id", id);
      if (error) {
        console.error("[terjemah] gagal simpan legasi:", error.message);
        return;
      }
      revalidatePath("/legasi");
      revalidatePath(`/legasi/${slug}`);
      console.log(`[terjemah] legasi ${slug} diterjemah.`);
    } catch (err) {
      console.error("[terjemah] legasi gagal:", err);
    }
  });
}
