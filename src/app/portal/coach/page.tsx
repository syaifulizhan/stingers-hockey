import Link from "next/link";
import { redirect } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { Users, Newspaper, ClipboardList } from "lucide-react";
import { createServerSupabase } from "@/lib/supabase/server";
import { getMyRole, isCoach, isAdmin } from "@/lib/portal-auth";
import NewsForm from "@/components/portal/coach/NewsForm";
import TaskForm from "@/components/portal/coach/TaskForm";
import MemberRow from "@/components/portal/coach/MemberRow";
import DeleteButton from "@/components/portal/coach/DeleteButton";

type Member = {
  clerk_user_id: string;
  full_name: string | null;
  year: string | null;
  class: string | null;
  role: string;
};
type NewsRow = { id: string; title: string; published_at: string };
type TaskRow = {
  id: string;
  title: string;
  assigned_to: string | null;
  due_date: string | null;
};

export default async function CoachPage() {
  // Pengawal: hanya coach/admin boleh masuk.
  const role = await getMyRole();
  if (!isCoach(role)) redirect("/portal/dashboard");
  const admin = isAdmin(role);

  const supabase = await createServerSupabase();
  const [membersRes, newsRes, tasksRes] = await Promise.all([
    supabase
      .from("users")
      .select("clerk_user_id, full_name, year, class, role")
      .order("full_name", { ascending: true }),
    supabase.from("news").select("id, title, published_at").order("published_at", { ascending: false }).limit(10),
    supabase.from("tasks").select("id, title, assigned_to, due_date").order("created_at", { ascending: false }).limit(20),
  ]);

  const members = (membersRes.data ?? []) as unknown as Member[];
  const news = (newsRes.data ?? []) as unknown as NewsRow[];
  const tasks = (tasksRes.data ?? []) as unknown as TaskRow[];
  const nameById = new Map(members.map((m) => [m.clerk_user_id, m.full_name]));

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <header className="flex items-center justify-between border-b border-line pb-5">
        <div className="flex items-center gap-3">
          <Link href="/portal/dashboard" className="display text-2xl text-paper">
            Stingers<span className="text-amber">.</span>
          </Link>
          <span className="rounded-full bg-amber/20 px-2.5 py-1 font-sans text-xs font-semibold uppercase text-amber">
            Jurulatih
          </span>
        </div>
        <UserButton />
      </header>

      <h1 className="display mt-8 text-4xl text-paper">Panel Jurulatih</h1>
      <p className="mt-2 font-sans text-sm text-muted">
        <Link href="/portal/dashboard" className="text-amber hover:underline">
          ← Kembali ke dashboard ahli
        </Link>
      </p>

      {/* Ahli */}
      <section className="mt-8">
        <h2 className="mb-4 flex items-center gap-2 font-sans text-sm font-semibold uppercase tracking-wider text-muted">
          <Users className="h-4 w-4" /> Ahli ({members.length})
        </h2>
        <div className="flex flex-col gap-2">
          {members.map((m) => (
            <MemberRow key={m.clerk_user_id} member={m} viewerIsAdmin={admin} />
          ))}
          {members.length === 0 && (
            <p className="font-sans text-sm text-muted">Belum ada ahli berdaftar.</p>
          )}
        </div>
      </section>

      {/* Berita */}
      <section className="mt-10">
        <h2 className="mb-4 flex items-center gap-2 font-sans text-sm font-semibold uppercase tracking-wider text-muted">
          <Newspaper className="h-4 w-4" /> Post Berita
        </h2>
        <NewsForm />
        {news.length > 0 && (
          <ul className="mt-4 flex flex-col gap-1">
            {news.map((n) => (
              <li
                key={n.id}
                className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 font-sans text-sm text-paper/80 hover:bg-bg-soft/50"
              >
                <span>
                  • {n.title}{" "}
                  <span className="text-muted">
                    ({new Date(n.published_at).toLocaleDateString("ms-MY")})
                  </span>
                </span>
                <DeleteButton
                  endpoint="/api/portal/coach/news"
                  id={n.id}
                  confirmMsg={`Padam berita "${n.title}"?`}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Tugasan */}
      <section className="mt-10">
        <h2 className="mb-4 flex items-center gap-2 font-sans text-sm font-semibold uppercase tracking-wider text-muted">
          <ClipboardList className="h-4 w-4" /> Beri Tugasan
        </h2>
        <TaskForm members={members.map((m) => ({ clerk_user_id: m.clerk_user_id, full_name: m.full_name }))} />
        {tasks.length > 0 && (
          <ul className="mt-4 flex flex-col gap-1">
            {tasks.map((t) => (
              <li
                key={t.id}
                className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 font-sans text-sm text-paper/80 hover:bg-bg-soft/50"
              >
                <span>
                  • {t.title}{" "}
                  <span className="text-muted">
                    → {t.assigned_to ? nameById.get(t.assigned_to) || "ahli" : "Semua ahli"}
                    {t.due_date ? ` · akhir ${t.due_date}` : ""}
                  </span>
                </span>
                <DeleteButton
                  endpoint="/api/portal/coach/task"
                  id={t.id}
                  confirmMsg={`Padam tugasan "${t.title}"? Hantaran ahli untuk tugasan ini juga akan terpadam.`}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
