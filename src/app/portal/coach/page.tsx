import Link from "next/link";
import { redirect } from "next/navigation";
import { Users, Newspaper, ClipboardList, CalendarCheck, Inbox } from "lucide-react";
import { createServerSupabase } from "@/lib/supabase/server";
import { getMyRole, isCoach, isAdmin } from "@/lib/portal-auth";
import PortalNav from "@/components/portal/PortalNav";
import SyncClerkButton from "@/components/portal/coach/SyncClerkButton";
import NewsForm from "@/components/portal/coach/NewsForm";
import TaskForm from "@/components/portal/coach/TaskForm";
import MembersPanel from "@/components/portal/coach/MembersPanel";
import NewsAdminItem from "@/components/portal/coach/NewsAdminItem";
import TaskAdminItem from "@/components/portal/coach/TaskAdminItem";
import AttendancePanel from "@/components/portal/coach/AttendancePanel";
import AttendanceStats from "@/components/portal/coach/AttendanceStats";
import SubmissionsReview from "@/components/portal/coach/SubmissionsReview";

type Member = {
  clerk_user_id: string;
  full_name: string | null;
  year: string | null;
  class: string | null;
  role: string;
  banned: boolean;
};
type NewsRow = { id: string; title: string; body: string | null; published_at: string };
type TaskRow = {
  id: string;
  title: string;
  description: string | null;
  assigned_to: string | null;
  due_date: string | null;
};
type SessionRow = { id: string; title: string; date: string | null; type: string };
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
  const [membersRes, newsRes, tasksRes, sessionsRes, attendanceRes, subsRes, allSubsRes] =
    await Promise.all([
      supabase
        .from("users")
        .select("clerk_user_id, full_name, year, class, role, banned")
        .order("full_name", { ascending: true }),
      supabase.from("news").select("id, title, body, published_at").order("published_at", { ascending: false }).limit(10),
      supabase.from("tasks").select("id, title, description, assigned_to, due_date").order("created_at", { ascending: false }).limit(20),
      supabase.from("sessions").select("id, title, date, type").order("created_at", { ascending: false }).limit(30),
      supabase.from("attendance").select("session_id, user_id, status"),
      supabase
        .from("submissions")
        .select("id, content, status, submitted_at, media_url, user_id, tasks(title)")
        .order("submitted_at", { ascending: false })
        .limit(50),
      supabase.from("submissions").select("task_id, user_id"),
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

  // Peratusan penghantaran (admin sahaja) — berdasarkan AHLI sahaja (bukan admin/coach).
  const allSubs = (allSubsRes.data ?? []) as unknown as {
    task_id: string;
    user_id: string;
  }[];
  const memberIds = new Set(
    members.filter((m) => m.role === "member").map((m) => m.clerk_user_id)
  );
  const memberCount = memberIds.size;
  const submittedByTask = new Map<string, number>();
  for (const s of allSubs) {
    if (memberIds.has(s.user_id)) {
      submittedByTask.set(s.task_id, (submittedByTask.get(s.task_id) ?? 0) + 1);
    }
  }
  const taskStat = (t: TaskRow) => {
    // Sasaran: 1 ahli jika ditugaskan khusus kepada ahli; jika tidak, semua ahli.
    const total = t.assigned_to
      ? memberIds.has(t.assigned_to)
        ? 1
        : 0
      : memberCount;
    const submitted = submittedByTask.get(t.id) ?? 0;
    const pct = total > 0 ? Math.round((submitted / total) * 100) : 0;
    return { submitted, total, pct };
  };
  const avgSubmissionPct = tasks.length
    ? Math.round(
        tasks.reduce((sum, t) => sum + taskStat(t).pct, 0) / tasks.length
      )
    : 0;

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <PortalNav badge="Jurulatih" />

      <h1 className="display mt-8 text-4xl text-paper">Panel Jurulatih</h1>
      <p className="mt-2 font-sans text-sm text-muted">
        <Link href="/portal/dashboard" className="text-amber hover:underline">
          ← Kembali ke dashboard ahli
        </Link>
      </p>

      {/* Ahli */}
      <section className="mt-8">
        <h2 className="mb-4 flex items-center gap-2 font-sans text-sm font-semibold uppercase tracking-wider text-muted">
          <Users className="h-4 w-4" /> Ahli
        </h2>
        {admin && <SyncClerkButton />}
        <MembersPanel members={members} admin={admin} />
      </section>

      {/* Berita */}
      <section className="mt-10">
        <h2 className="mb-4 flex items-center gap-2 font-sans text-sm font-semibold uppercase tracking-wider text-muted">
          <Newspaper className="h-4 w-4" /> Post Berita
        </h2>
        <NewsForm />
        {news.length > 0 && (
          <div className="mt-4 flex flex-col gap-1">
            {news.map((n) => (
              <NewsAdminItem key={n.id} news={n} />
            ))}
          </div>
        )}
      </section>

      {/* Tugasan */}
      <section className="mt-10">
        <h2 className="mb-4 flex items-center gap-2 font-sans text-sm font-semibold uppercase tracking-wider text-muted">
          <ClipboardList className="h-4 w-4" /> Beri Tugasan
        </h2>
        {admin && (
          <div className="mb-4 flex items-center gap-3 rounded-xl border border-amber/40 bg-amber/10 px-5 py-3">
            <span className="display text-2xl text-amber">{avgSubmissionPct}%</span>
            <span className="font-sans text-sm text-paper/90">
              Purata penghantaran ahli ({memberCount}{" "}
              {memberCount === 1 ? "ahli" : "ahli"})
            </span>
          </div>
        )}
        <TaskForm members={members.map((m) => ({ clerk_user_id: m.clerk_user_id, full_name: m.full_name }))} />
        {tasks.length > 0 && (
          <div className="mt-4 flex flex-col gap-1">
            {tasks.map((t) => (
              <TaskAdminItem
                key={t.id}
                task={t}
                members={members.map((m) => ({
                  clerk_user_id: m.clerk_user_id,
                  full_name: m.full_name,
                }))}
                assigneeName={
                  t.assigned_to
                    ? nameById.get(t.assigned_to) || "ahli"
                    : "Semua ahli"
                }
                stat={admin ? taskStat(t) : null}
              />
            ))}
          </div>
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

        {/* Statistik kehadiran automatik */}
        <h3 className="mb-3 mt-8 font-sans text-xs font-semibold uppercase tracking-wider text-muted">
          📊 Statistik Kehadiran
        </h3>
        <AttendanceStats members={members} sessions={sessions} attendance={attendance} />
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
