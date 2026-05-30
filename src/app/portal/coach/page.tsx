import Link from "next/link";
import { redirect } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { Users, Newspaper, ClipboardList, CalendarCheck, Inbox } from "lucide-react";
import { createServerSupabase } from "@/lib/supabase/server";
import { getMyRole, isCoach, isAdmin } from "@/lib/portal-auth";
import NewsForm from "@/components/portal/coach/NewsForm";
import TaskForm from "@/components/portal/coach/TaskForm";
import MemberRow from "@/components/portal/coach/MemberRow";
import DeleteButton from "@/components/portal/coach/DeleteButton";
import AttendancePanel from "@/components/portal/coach/AttendancePanel";
import SubmissionsReview from "@/components/portal/coach/SubmissionsReview";
import NotificationBell from "@/components/portal/NotificationBell";
import Wordmark from "@/components/ui/Wordmark";

type Member = {
  clerk_user_id: string;
  full_name: string | null;
  year: string | null;
  class: string | null;
  role: string;
  banned: boolean;
};
type NewsRow = { id: string; title: string; published_at: string };
type TaskRow = {
  id: string;
  title: string;
  assigned_to: string | null;
  due_date: string | null;
};
type SessionRow = { id: string; title: string; date: string | null };
type AttendanceRow = { session_id: string; user_id: string; status: string };
type SubmissionRow = {
  id: string;
  content: string | null;
  status: string;
  submitted_at: string;
  media_url: string | null;
  user_id: string;
  tasks: { title: string } | null;
};

export default async function CoachPage() {
  // Pengawal: hanya coach/admin boleh masuk.
  const role = await getMyRole();
  if (!isCoach(role)) redirect("/portal/dashboard");
  const admin = isAdmin(role);

  const supabase = await createServerSupabase();
  const [membersRes, newsRes, tasksRes, sessionsRes, attendanceRes, subsRes] =
    await Promise.all([
      supabase
        .from("users")
        .select("clerk_user_id, full_name, year, class, role, banned")
        .order("full_name", { ascending: true }),
      supabase.from("news").select("id, title, published_at").order("published_at", { ascending: false }).limit(10),
      supabase.from("tasks").select("id, title, assigned_to, due_date").order("created_at", { ascending: false }).limit(20),
      supabase.from("sessions").select("id, title, date").order("created_at", { ascending: false }).limit(30),
      supabase.from("attendance").select("session_id, user_id, status"),
      supabase
        .from("submissions")
        .select("id, content, status, submitted_at, media_url, user_id, tasks(title)")
        .order("submitted_at", { ascending: false })
        .limit(50),
    ]);

  const members = (membersRes.data ?? []) as unknown as Member[];
  const news = (newsRes.data ?? []) as unknown as NewsRow[];
  const tasks = (tasksRes.data ?? []) as unknown as TaskRow[];
  const sessions = (sessionsRes.data ?? []) as unknown as SessionRow[];
  const attendance = (attendanceRes.data ?? []) as unknown as AttendanceRow[];
  const subs = (subsRes.data ?? []) as unknown as SubmissionRow[];
  const nameById = new Map(members.map((m) => [m.clerk_user_id, m.full_name]));

  const submissions = subs.map((s) => ({
    id: s.id,
    content: s.content,
    status: s.status,
    submitted_at: s.submitted_at,
    media_url: s.media_url,
    task_title: s.tasks?.title ?? "Tugasan",
    member_name: nameById.get(s.user_id) || "Ahli",
  }));

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <header className="flex items-center justify-between border-b border-line pb-5">
        <div className="flex items-center gap-3">
          <Link href="/" aria-label="Stingers Hockey — laman utama">
            <Wordmark className="text-xl" />
          </Link>
          <span className="rounded-full bg-amber/20 px-2.5 py-1 font-sans text-xs font-semibold uppercase text-amber">
            Jurulatih
          </span>
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <UserButton />
        </div>
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

      {/* Kehadiran */}
      <section className="mt-10">
        <h2 className="mb-4 flex items-center gap-2 font-sans text-sm font-semibold uppercase tracking-wider text-muted">
          <CalendarCheck className="h-4 w-4" /> Rekod Kehadiran
        </h2>
        <AttendancePanel
          sessions={sessions}
          members={members.map((m) => ({
            clerk_user_id: m.clerk_user_id,
            full_name: m.full_name,
          }))}
          attendance={attendance}
        />
      </section>

      {/* Semak hantaran */}
      <section className="mt-10">
        <h2 className="mb-4 flex items-center gap-2 font-sans text-sm font-semibold uppercase tracking-wider text-muted">
          <Inbox className="h-4 w-4" /> Semak Hantaran Tugasan
        </h2>
        <SubmissionsReview submissions={submissions} />
      </section>
    </div>
  );
}
