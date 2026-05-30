import Link from "next/link";
import { createPublicSupabase } from "@/lib/supabase/public";
import Reveal from "@/components/ui/Reveal";

type NewsRow = {
  id: string;
  title: string;
  body: string | null;
  image_url: string | null;
  published_at: string;
};

export default async function Berita() {
  const supabase = createPublicSupabase();
  const { data } = await supabase
    .from("news")
    .select("id, title, body, image_url, published_at")
    .order("published_at", { ascending: false })
    .limit(3);

  const news = (data ?? []) as unknown as NewsRow[];
  if (news.length === 0) return null; // tiada berita → jangan papar seksyen

  return (
    <section id="berita" className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <Reveal>
          <span className="font-sans text-sm font-semibold uppercase tracking-[0.3em] text-amber">
            Berita Terkini
          </span>
        </Reveal>
        <Reveal delay={0.1}>
          <h2 className="display mt-5 text-5xl text-paper sm:text-6xl">
            Apa Yang <span className="text-amber">Terjadi</span>
          </h2>
        </Reveal>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {news.map((n, i) => (
            <Reveal key={n.id} delay={0.1 + i * 0.08}>
              <Link
                href={`/berita/${n.id}`}
                className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-bg-soft transition-colors hover:border-amber/60"
              >
                {n.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element -- gambar dari Supabase Storage
                  <img
                    src={n.image_url}
                    alt={n.title}
                    className="aspect-video w-full object-cover"
                  />
                ) : (
                  <div className="aspect-video w-full bg-ink" />
                )}
                <div className="flex flex-1 flex-col p-6">
                  <p className="font-sans text-xs uppercase tracking-wider text-muted">
                    {new Date(n.published_at).toLocaleDateString("ms-MY", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                  <h3 className="mt-2 font-sans text-lg font-semibold text-paper">
                    {n.title}
                  </h3>
                  {n.body && (
                    <p className="mt-2 line-clamp-2 font-sans text-sm text-muted">
                      {n.body}
                    </p>
                  )}
                  <span className="mt-4 font-sans text-sm font-semibold text-amber">
                    Baca lagi →
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
