import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import { UserButton } from "@clerk/nextjs";
import { Newspaper, ClipboardList, CalendarCheck } from "lucide-react";
import { createServerSupabase } from "@/lib/supabase/server";
import TaskCard from "@/components/portal/TaskCard";

// Lajur yang dikira untuk peratus "% lengkap" profil.
const PROFILE_COLS = [
  "full_name",
  "year",
  "class",
  "date_of_birth",
  "gender",
  "ic_number",
  "school",
  "school_reg_no",
  "player_phone",
  "guardian_phone",
  "guardian_email",
  "experience",
  "position",
  "notes",
];

function filledCount(row: Record<string, unknown> | null) {
  if (!row) return 0;
  return PROFILE_COLS.filter((c) => {
    const v = row[c];
    return v !== null && v !== undefined && String(v).trim() !== "";
  }).length;
}

type NewsRow = { id: string; title: string; body: string | null; published_at: string };
type TaskRow = { id: string; title: string; description: string | null; due_date: string | null };
type SubmissionRow = { task_id: string; content: string | null; status: string };
type AttendanceRow = {
  status: string;
  created_at: string;
  sessions: { title: string; date: string | null } | null;
};

export default async function DashboardPage() {
  const user = await currentUser();
  const supabase = await createServerSupabase();

  const [profileRes, newsRes, tasksRes, subsRes, attRes] = await Promise.all([
    supabase.from("users").select("*").eq("clerk_user_id", user!.id).maybeSingle(),
    supabase.from("news").select("*").order("published_at", { ascending: false }).limit(8),
    supabase.from("tasks").select("*").order("created_at", { ascending: false }),
    supabase.from("submissions").select("task_id, content, status"),
    supabase
      .from("attendance")
      .select("status, created_at, sessions(title, date)")
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  const profile = (profileRes.data ?? null) as Record<string, unknown> | null;
  const news = (newsRes.data ?? []) as unknown as NewsRow[];
  const tasks = (tasksRes.data ?? []) as unknown as TaskRow[];
  const submissions = (subsRes.data ?? []) as unknown as SubmissionRow[];
  const attendance = (attRes.data ?? []) as unknown as AttendanceRow[];

  const name =
    (profile?.full_name as string) || user?.firstName || user?.username || "Ahli";
  const role = (profile?.role as string) ?? "member";
  const isCoachOrAdmin = role === "coach" || role === "admin";
  const percent = profile
    ? Math.round((filledCount(profile) / PROFILE_COLS.length) * 100)
    : 0;

  const subByTask = new Map(submissions.map((s) => [s.task_id, s]));

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-line pb-5">
        <Link href="/portal/dashboard" className="display text-2xl text-paper">
          Stingers<span className="text-amber">.</span>
        </Link>
        <UserButton />
      </header>

      <h1 className="display mt-8 text-4xl text-paper">
        Hai, <span className="text-amber">{name}</span> 👋
      </h1>

      {isCoachOrAdmin && (
        <Link
          href="/portal/coach"
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-amber px-5 py-2.5 font-sans text-sm font-semibold uppercase tracking-wider text-ink transition-colors hover:bg-amber-deep"
        >
          🏑 Panel Jurulatih →
        </Link>
      )}

      {/* Kad: kelengkapan profil */}
      <section className="mt-6 rounded-2xl border border-line bg-bg-soft/50 p-6">
        <div className="mb-2 flex items-center justify-between font-sans text-sm">
          <span className="text-paper/90">Profil lengkap</span>
          <span className="font-semibold text-amber">{percent}%</span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-ink">
          <div
            className="h-full rounded-full bg-amber transition-all"
            style={{ width: `${percent}%` }}
          />
        </div>
        <Link
          href="/portal/onboarding"
          className="mt-4 inline-block font-sans text-sm font-semibold text-amber hover:text-amber-deep"
        >
          {percent >= 100 ? "Kemas kini profil →" : "Lengkapkan profil →"}
        </Link>
      </section>

      {/* Berita */}
      <section className="mt-8">
        <h2 className="mb-4 flex items-center gap-2 font-sans text-sm font-semibold uppercase tracking-wider text-muted">
          <Newspaper className="h-4 w-4" /> Berita Pasukan
        </h2>
        {news && news.length > 0 ? (
          <div className="flex flex-col gap-3">
            {news.map((n: { id: string; title: string; body: string | null; published_at: string }) => (
              <article key={n.id} className="rounded-xl border border-line bg-bg-soft/50 p-5">
                <h3 className="font-sans text-base font-semibold text-paper">{n.title}</h3>
                {n.body && <p className="mt-1 font-sans text-sm text-muted">{n.body}</p>}
                <p className="mt-2 font-sans text-xs text-muted">
                  {new Date(n.published_at).toLocaleDateString("ms-MY")}
                </p>
              </article>
            ))}
          </div>
        ) : (
          <p className="font-sans text-sm text-muted">Tiada berita buat masa ini.</p>
        )}
      </section>

      {/* Tugasan */}
      <section className="mt-8">
        <h2 className="mb-4 flex items-center gap-2 font-sans text-sm font-semibold uppercase tracking-wider text-muted">
          <ClipboardList className="h-4 w-4" /> Tugasan Latihan
        </h2>
        {tasks && tasks.length > 0 ? (
          <div className="flex flex-col gap-3">
            {tasks.map((t: { id: string; title: string; description: string | null; due_date: string | null }) => (
              <TaskCard
                key={t.id}
                task={t}
                submission={subByTask.get(t.id) ?? null}
              />
            ))}
          </div>
        ) : (
          <p className="font-sans text-sm text-muted">
            Tiada tugasan buat masa ini. Jurulatih akan beri tugasan nanti.
          </p>
        )}
      </section>

      {/* Kehadiran */}
      <section className="mt-8">
        <h2 className="mb-4 flex items-center gap-2 font-sans text-sm font-semibold uppercase tracking-wider text-muted">
          <CalendarCheck className="h-4 w-4" /> Kehadiran Terkini
        </h2>
        {attendance && attendance.length > 0 ? (
          <div className="flex flex-col gap-2">
            {attendance.map(
              (
                a: { status: string; created_at: string; sessions: { title: string; date: string | null } | null },
                i: number
              ) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg border border-line bg-bg-soft/50 px-4 py-3"
                >
                  <span className="font-sans text-sm text-paper/90">
                    {a.sessions?.title ?? "Sesi latihan"}
                    {a.sessions?.date ? ` — ${a.sessions.date}` : ""}
                  </span>
                  <span
                    className={`font-sans text-xs font-semibold uppercase ${
                      a.status === "present"
                        ? "text-amber"
                        : a.status === "excused"
                          ? "text-muted"
                          : "text-paper/50"
                    }`}
                  >
                    {a.status === "present"
                      ? "Hadir"
                      : a.status === "excused"
                        ? "Dimaafkan"
                        : "Tidak Hadir"}
                  </span>
                </div>
              )
            )}
          </div>
        ) : (
          <p className="font-sans text-sm text-muted">Belum ada rekod kehadiran.</p>
        )}
      </section>
    </div>
  );
}
