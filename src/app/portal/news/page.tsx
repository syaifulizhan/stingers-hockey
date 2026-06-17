import Link from "next/link";
import { ArrowLeft, Newspaper, ChevronRight } from "lucide-react";
import { createServerSupabase } from "@/lib/supabase/server";

type NewsRow = {
  id: string;
  title: string;
  body: string | null;
  image_url: string | null;
  published_at: string;
};

export default async function PortalNewsArchivePage() {
  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from("news")
    .select("id, title, body, image_url, published_at")
    .order("published_at", { ascending: false });

  const news = (data ?? []) as unknown as NewsRow[];

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <Link
        href="/portal/dashboard"
        className="inline-flex items-center gap-1.5 font-sans text-sm text-muted transition-colors hover:text-amber"
      >
        <ArrowLeft className="h-4 w-4" /> Kembali ke dashboard
      </Link>

      <h1 className="display mt-6 text-4xl text-paper">
        Semua <span className="text-amber">Berita</span>
      </h1>
      <p className="mt-2 font-sans text-sm text-muted">
        {news.length} berita keseluruhan
      </p>

      <div className="mt-8 flex flex-col gap-2">
        {news.length === 0 ? (
          <p className="font-sans text-sm text-muted">Tiada berita buat masa ini.</p>
        ) : (
          news.map((n) => (
            <Link
              key={n.id}
              href={`/portal/news/${n.id}`}
              className="flex items-center gap-4 rounded-xl border border-line bg-bg-soft/50 p-3 transition-colors hover:border-amber/60"
            >
              {n.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element -- gambar dari Supabase Storage
                <img
                  src={n.image_url}
                  alt=""
                  className="h-16 w-16 shrink-0 rounded-lg object-cover"
                />
              ) : (
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-ink text-amber">
                  <Newspaper className="h-6 w-6" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h2 className="truncate font-sans text-base font-semibold text-paper">
                  {n.title}
                </h2>
                <p className="font-sans text-xs text-muted">
                  {new Date(n.published_at).toLocaleDateString("ms-MY", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
                {n.body && (
                  <p className="mt-0.5 line-clamp-1 font-sans text-xs text-muted/70">
                    {n.body}
                  </p>
                )}
              </div>
              {Date.now() - new Date(n.published_at).getTime() <
                7 * 24 * 60 * 60 * 1000 && (
                <span className="shrink-0 rounded-full bg-amber/20 px-2 py-0.5 font-sans text-[0.6rem] font-bold uppercase tracking-wide text-amber">
                  Baru
                </span>
              )}
              <ChevronRight className="h-5 w-5 shrink-0 text-muted" />
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
