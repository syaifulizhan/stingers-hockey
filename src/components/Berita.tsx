import { createPublicSupabase } from "@/lib/supabase/public";
import BeritaView from "@/components/BeritaView";

type NewsRow = {
  id: string;
  title: string;
  body: string | null;
  image_url: string | null;
  published_at: string;
  slug: string | null;
};

// Server component: ambil berita, kemudian render paparan (client) yang dwibahasa.
export default async function Berita() {
  const supabase = createPublicSupabase();
  const { data } = await supabase
    .from("news")
    .select("id, title, body, image_url, published_at, slug")
    .order("published_at", { ascending: false })
    .limit(3);

  const news = (data ?? []) as unknown as NewsRow[];
  if (news.length === 0) return null; // tiada berita → jangan papar seksyen

  return <BeritaView news={news} />;
}
