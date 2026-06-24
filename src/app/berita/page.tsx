import type { Metadata } from "next";
import { createPublicSupabase } from "@/lib/supabase/public";

export const revalidate = 60;
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import BeritaArchiveView from "@/components/BeritaArchiveView";

export const metadata: Metadata = {
  title: "Berita — Stingers Hockey",
  description: "Semua berita dan perkembangan terkini pasukan Stingers Hockey.",
};

type NewsRow = {
  id: string;
  title: string;
  body: string | null;
  image_url: string | null;
  published_at: string;
  slug: string | null;
};

export default async function BeritaArchivePage() {
  const supabase = createPublicSupabase();
  const { data } = await supabase
    .from("news")
    .select("id, title, body, image_url, published_at, slug")
    .order("published_at", { ascending: false });

  const news = (data ?? []) as unknown as NewsRow[];

  return (
    <>
      <Navigation />
      <main className="flex-1">
        <BeritaArchiveView news={news} />
      </main>
      <Footer />
    </>
  );
}
