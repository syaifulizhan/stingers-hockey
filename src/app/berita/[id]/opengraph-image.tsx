import { kadOg, SAIZ_OG, JENIS_OG } from "@/lib/og";
import { ringkasan } from "@/lib/seo";
import { createPublicSupabase } from "@/lib/supabase/public";

export const alt = "Berita Stingers Hockey";
export const size = SAIZ_OG;
export const contentType = JENIS_OG;

// Next 16: params ialah Promise.
export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createPublicSupabase();
  const { data } = await supabase
    .from("news")
    .select("title, body, image_url")
    .eq("slug", id)
    .maybeSingle();

  // Artikel tanpa gambar tetap mendapat kad berjenama dengan tajuknya —
  // itulah keseluruhan sebab kad ini dijana dan bukan sekadar dilangkau.
  return kadOg({
    kicker: "Berita",
    tajuk: (data?.title as string) ?? "Berita Stingers Hockey",
    perihal: ringkasan(data?.body as string | null, 130),
    latar: (data?.image_url as string | null) ?? null,
  });
}
