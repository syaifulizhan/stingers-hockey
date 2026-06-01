import Link from "next/link";
import { redirect } from "next/navigation";
import { Users, Newspaper, ClipboardList, CalendarCheck, Inbox, Star, Activity, Swords, Trophy } from "lucide-react";
import { createServerSupabase } from "@/lib/supabase/server";
import { getMyRole, isCoach, isAdmin } from "@/lib/portal-auth";
import { memberName } from "@/lib/names";
import { assessmentAverage } from "@/lib/assessments";
import { generateReport } from "@/lib/report";
import PortalNav from "@/components/portal/PortalNav";
import SyncClerkButton from "@/components/portal/coach/SyncClerkButton";
import NewsForm from "@/components/portal/coach/NewsForm";
import TaskForm from "@/components/portal/coach/TaskForm";
import MembersPanel from "@/components/portal/coach/MembersPanel";
import SubmissionsReview from "@/components/portal/coach/SubmissionsReview";
import NewsAdminItem from "@/components/portal/coach/NewsAdminItem";
import TaskAdminItem from "@/components/portal/coach/TaskAdminItem";
import AttendancePanel from "@/components/portal/coach/AttendancePanel";
import AttendanceStats from "@/components/portal/coach/AttendanceStats";
import AssessmentForm from "@/components/portal/coach/AssessmentForm";
import FitnessPanel from "@/components/portal/coach/FitnessPanel";
import MatchPanel from "@/components/portal/coach/MatchPanel";
import AchievementsPanel from "@/components/portal/coach/AchievementsPanel";
import CoachSummary from "@/components/portal/coach/CoachSummary";
import ReportPanel from "@/components/portal/coach/ReportPanel";
import CoachTabs from "@/components/portal/coach/CoachTabs";

type Member = {
  clerk_user_id: string;
  full_name: string | null;
  display_name: string | null;
  year: string | null;
  class: string | null;
  role: string;
  banned: boolean;
  is_goalkeeper: boolean;
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
  task_id: string;
  content: string | null;
  status: string;
  submitted_at: string;
  media_url: string | null;
  user_id: string;
  late: boolean;
  tasks: { title: string } | null;
};

// Sentiasa render segar — elak Router Cache sajikan data lama selepas navigasi.
export const dynamic = "force-dynamic";

export default async function CoachPage() {
  // Pengawal: hanya coach/admin boleh masuk.
  const role = await getMyRole();
  if (!isCoach(role)) redirect("/portal/dashboard");
  const admin = isAdmin(role);

  const supabase = await createServerSupabase();
  const [membersRes, newsRes, tasksRes, sessionsRes, attendanceRes, subsRes, allSubsRes, assessmentsRes, fitnessRes, seasonsRes, matchesRes, matchStatsRes, achievementsRes] =
    await Promise.all([
      supabase
        .from("users")
        .select("clerk_user_id, full_name, display_name, year, class, role, banned, is_goalkeeper")
        .order("full_name", { ascending: true }),
      supabase.from("news").select("id, title, body, published_at").order("published_at", { ascending: false }).limit(10),
      supabase.from("tasks").select("id, title, description, assigned_to, due_date").order("created_at", { ascending: false }).limit(20),
      supabase.from("sessions").select("id, title, date, type").order("created_at", { ascending: false }).limit(30),
      supabase.from("attendance").select("session_id, user_id, status"),
      supabase
        .from("submissions")
        .select("id, task_id, content, status, submitted_at, media_url, user_id, late, tasks(title)")
        .order("submitted_at", { ascending: false })
        .limit(200),
      supabase.from("submissions").select("task_id, user_id, status, late"),
      supabase
        .from("assessments")
        .select("user_id, type, scores, assessed_on")
        .order("assessed_on", { ascending: false }),
      supabase
        .from("fitness_tests")
        .select("user_id, tested_on, results")
        .order("tested_on", { ascending: true }),
      supabase.from("seasons").select("id, name, closed, team").order("created_at", { ascending: false }),
      supabase
        .from("matches")
        .select("id, season_id, opponent, match_date, venue, competition, category, our_score, opp_score")
        .order("match_date", { ascending: false }),
      supabase.from("match_stats").select("id, match_id, user_id, position, stats"),
      supabase
        .from("achievements")
        .select("id, season_id, category, award, player_id, event")
        .order("created_at", { ascending: false }),
    ]);

  const members = (membersRes.data ?? []) as unknown as Member[];
  const news = (newsRes.data ?? []) as unknown as NewsRow[];
  const tasks = (tasksRes.data ?? []) as unknown as TaskRow[];
  const sessions = (sessionsRes.data ?? []) as unknown as SessionRow[];
  const attendance = (attendanceRes.data ?? []) as unknown as AttendanceRow[];
  const subs = (subsRes.data ?? []) as unknown as SubmissionRow[];
  const nameById = new Map(
    members.map((m) => [m.clerk_user_id, memberName(m.full_name, m.display_name)])
  );

  // Skor penilaian TERKINI ikut `${userId}:${type}` (untuk pra-isi borang).
  const assessmentRows = (assessmentsRes.data ?? []) as unknown as {
    user_id: string;
    type: string;
    scores: Record<string, number>;
    assessed_on: string;
  }[];
  const latestAssessment: Record<string, Record<string, number>> = {};
  for (const a of assessmentRows) {
    const key = `${a.user_id}:${a.type}`;
    if (!latestAssessment[key]) latestAssessment[key] = a.scores ?? {}; // tersusun desc → pertama = terkini
  }
  // Sejarah ujian kecergasan ikut pemain (untuk PB/graf).
  const fitnessRows = (fitnessRes.data ?? []) as unknown as {
    user_id: string;
    tested_on: string;
    results: Record<string, number>;
  }[];
  const fitnessByUser: Record<string, { tested_on: string; results: Record<string, number> }[]> = {};
  for (const f of fitnessRows) {
    (fitnessByUser[f.user_id] ??= []).push({ tested_on: f.tested_on, results: f.results ?? {} });
  }

  const seasons = (seasonsRes.data ?? []) as unknown as { id: string; name: string; closed: boolean; team: string }[];
  const matches = (matchesRes.data ?? []) as unknown as {
    id: string;
    season_id: string | null;
    opponent: string;
    match_date: string | null;
    venue: string | null;
    competition: string | null;
    category: string | null;
    our_score: number | null;
    opp_score: number | null;
  }[];
  const matchStats = (matchStatsRes.data ?? []) as unknown as {
    id: string;
    match_id: string;
    user_id: string;
    position: string | null;
    stats: Record<string, number>;
  }[];

  const achievements = (achievementsRes.data ?? []) as unknown as {
    id: string;
    season_id: string | null;
    category: string;
    award: string;
    player_id: string | null;
    event: string | null;
  }[];

  // ── Fasa 7: Ringkasan jurulatih ──
  const playerList = members.filter((m) => m.role === "member" && !m.banned);
  const nameOf = (id: string) => nameById.get(id) || "Ahli";

  const totalSessionsCount = sessions.length;
  const presentCount = new Map<string, number>();
  for (const a of attendance) {
    if (a.status === "present") presentCount.set(a.user_id, (presentCount.get(a.user_id) ?? 0) + 1);
  }

  const goalsByUser = new Map<string, number>();
  const savesByUser = new Map<string, number>();
  for (const s of matchStats) {
    const g = s.stats?.goals ?? 0;
    if (g) goalsByUser.set(s.user_id, (goalsByUser.get(s.user_id) ?? 0) + g);
    const sv = s.stats?.save ?? 0;
    if (sv) savesByUser.set(s.user_id, (savesByUser.get(s.user_id) ?? 0) + sv);
  }

  // Siri penilaian kemahiran (untuk "paling meningkat"); assessmentRows tersusun desc.
  const skillSeries = new Map<string, number[]>();
  for (const r of assessmentRows) {
    if (r.type !== "skill_field") continue;
    const arr = skillSeries.get(r.user_id) ?? [];
    arr.push(assessmentAverage("skill_field", r.scores)); // desc: [0]=terkini
    skillSeries.set(r.user_id, arr);
  }

  type Leader = { name: string; value: string } | null;
  let mostImproved: Leader = null;
  let bestAttendance: Leader = null;
  let topScorer: Leader = null;
  let bestGK: Leader = null;
  let topImpDelta = 0;
  let topAttPct = -1;
  let topGoals = 0;
  let topSaves = 0;

  for (const m of playerList) {
    const id = m.clerk_user_id;
    const arr = skillSeries.get(id);
    if (arr && arr.length >= 2) {
      const delta = arr[0] - arr[arr.length - 1];
      if (delta > 0 && delta > topImpDelta) {
        topImpDelta = delta;
        mostImproved = { name: nameOf(id), value: `+${Math.round(delta * 10) / 10}` };
      }
    }
    if (totalSessionsCount > 0) {
      const pct = Math.round(((presentCount.get(id) ?? 0) / totalSessionsCount) * 100);
      if (pct > topAttPct) {
        topAttPct = pct;
        bestAttendance = { name: nameOf(id), value: `${pct}%` };
      }
    }
    const g = goalsByUser.get(id) ?? 0;
    if (g > topGoals) {
      topGoals = g;
      topScorer = { name: nameOf(id), value: `${g} gol` };
    }
    if (m.is_goalkeeper) {
      const sv = savesByUser.get(id) ?? 0;
      if (sv > topSaves) {
        topSaves = sv;
        bestGK = { name: nameOf(id), value: `${sv} save` };
      }
    }
  }

  // Jumlah statistik perlawanan setiap pemain (untuk laporan ringkas).
  const matchTotalsByUser = new Map<string, Record<string, number>>();
  for (const s of matchStats) {
    const acc = matchTotalsByUser.get(s.user_id) ?? {};
    for (const [k, v] of Object.entries(s.stats ?? {})) acc[k] = (acc[k] ?? 0) + v;
    matchTotalsByUser.set(s.user_id, acc);
  }

  // Laporan ringkas (paparan portal) setiap pemain; versi cetak A4 di /portal/report/[id].
  const reportPlayers = playerList.map((m) => {
    const id = m.clerk_user_id;
    const att =
      totalSessionsCount > 0
        ? Math.round(((presentCount.get(id) ?? 0) / totalSessionsCount) * 100)
        : null;
    const report = generateReport({
      isGoalkeeper: !!m.is_goalkeeper,
      skill: latestAssessment[`${id}:${m.is_goalkeeper ? "skill_gk" : "skill_field"}`] ?? null,
      coachEval: latestAssessment[`${id}:coach_eval`] ?? null,
      attendancePct: att,
      matchTotals: matchTotalsByUser.get(id) ?? {},
    });
    return { id, name: nameOf(id), report };
  });

  // Top 10 — purata gabungan kemahiran + penilaian jurulatih + kehadiran (skala 10).
  const top10 = playerList
    .map((m) => {
      const id = m.clerk_user_id;
      const parts: number[] = [];
      const sk = latestAssessment[`${id}:skill_field`];
      if (sk) parts.push(assessmentAverage("skill_field", sk));
      const ce = latestAssessment[`${id}:coach_eval`];
      if (ce) parts.push(assessmentAverage("coach_eval", ce));
      if (totalSessionsCount > 0) parts.push(((presentCount.get(id) ?? 0) / totalSessionsCount) * 10);
      const score = parts.length ? parts.reduce((a, b) => a + b, 0) / parts.length : 0;
      return { name: nameOf(id), score: Math.round(score * 10) / 10 };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  // Ahli aktif (bukan diban) — untuk semua senarai tindakan (task, kehadiran).
  const activeMembers = members.filter((m) => !m.banned);
  const playerMembers = members
    .filter((m) => m.role === "member" && !m.banned)
    .map((m) => ({
      clerk_user_id: m.clerk_user_id,
      full_name: m.full_name,
      display_name: m.display_name,
      is_goalkeeper: m.is_goalkeeper,
    }));

  const submissions = subs.map((s) => ({
    id: s.id,
    task_id: s.task_id,
    content: s.content,
    status: s.status,
    submitted_at: s.submitted_at,
    media_url: s.media_url,
    late: s.late,
    task_title: s.tasks?.title ?? "Tugasan",
    member_name: nameById.get(s.user_id) || "Ahli",
  }));
  // Hantaran ikut task + helper "lepas tarikh akhir" (selepas 11:59pm hari akhir).
  const subsByTask = new Map<string, typeof submissions>();
  for (const s of submissions) {
    const arr = subsByTask.get(s.task_id) ?? [];
    arr.push(s);
    subsByTask.set(s.task_id, arr);
  }
  const isPastDue = (t: TaskRow) =>
    !!t.due_date && Date.now() > new Date(`${t.due_date}T23:59:59`).getTime();
  // Task lepas tarikh akhir = arkib (hantaran kuncup dalam task itu).
  // Hantaran task AKTIF kekal di seksyen "Semak Hantaran" di bawah.
  const pastDueTaskIds = new Set(tasks.filter(isPastDue).map((t) => t.id));
  const activeSubmissions = submissions.filter((s) => !pastDueTaskIds.has(s.task_id));

  // Peratusan penghantaran (admin sahaja) — berdasarkan AHLI aktif sahaja
  // (bukan admin/coach, dan bukan yang diban).
  const allSubs = (allSubsRes.data ?? []) as unknown as {
    task_id: string;
    user_id: string;
    status: string;
    late: boolean;
  }[];
  const memberIds = new Set(
    members
      .filter((m) => m.role === "member" && !m.banned)
      .map((m) => m.clerk_user_id)
  );
  const memberCount = memberIds.size;

  // Kiraan setiap task (ahli aktif sahaja).
  const byTask = new Map<string, { submitted: number; reviewed: number; revise: number; late: number }>();
  for (const s of allSubs) {
    if (!memberIds.has(s.user_id)) continue;
    const acc = byTask.get(s.task_id) ?? { submitted: 0, reviewed: 0, revise: 0, late: 0 };
    acc.submitted += 1;
    if (s.status === "reviewed") acc.reviewed += 1;
    if (s.status === "revise") acc.revise += 1;
    if (s.late) acc.late += 1;
    byTask.set(s.task_id, acc);
  }
  const taskSummary = (t: TaskRow) => {
    // Sasaran: 1 ahli jika ditugaskan khusus; jika tidak, semua ahli aktif.
    const target = t.assigned_to ? (memberIds.has(t.assigned_to) ? 1 : 0) : memberCount;
    const c = byTask.get(t.id) ?? { submitted: 0, reviewed: 0, revise: 0, late: 0 };
    const pct = target > 0 ? Math.round((c.submitted / target) * 100) : 0;
    return { target, ...c, pct };
  };
  const avgSubmissionPct = tasks.length
    ? Math.round(tasks.reduce((sum, t) => sum + taskSummary(t).pct, 0) / tasks.length)
    : 0;

  const sectionTitle =
    "mb-4 flex items-center gap-2 font-sans text-sm font-semibold uppercase tracking-wider text-muted";

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <PortalNav badge="Jurulatih" />

      <h1 className="display mt-8 text-4xl text-paper">Panel Jurulatih</h1>
      <p className="mt-2 font-sans text-sm text-muted">
        <Link href="/portal/dashboard" className="text-amber hover:underline">
          ← Kembali ke dashboard ahli
        </Link>
      </p>

      <CoachTabs
        tabs={[
          {
            id: "ringkasan",
            label: "Ringkasan",
            content: (
              <section>
                <h2 className={sectionTitle}>
                  <Trophy className="h-4 w-4" /> Ringkasan Pasukan
                </h2>
                <CoachSummary
                  totalPlayers={playerList.length}
                  mostImproved={mostImproved}
                  bestAttendance={bestAttendance}
                  topScorer={topScorer}
                  bestGK={bestGK}
                  top10={top10}
                />
              </section>
            ),
          },
          {
            id: "ahli",
            label: "Ahli",
            content: (
              <section>
                <h2 className={sectionTitle}>
                  <Users className="h-4 w-4" /> Ahli
                </h2>
                {admin && <SyncClerkButton />}
                <MembersPanel members={members} admin={admin} />
              </section>
            ),
          },
          {
            id: "kehadiran",
            label: "Kehadiran",
            content: (
              <section>
                <h2 className={sectionTitle}>
                  <CalendarCheck className="h-4 w-4" /> Rekod Kehadiran
                </h2>
                <AttendancePanel
                  sessions={sessions}
                  members={activeMembers.map((m) => ({
                    clerk_user_id: m.clerk_user_id,
                    full_name: memberName(m.full_name, m.display_name),
                    role: m.role,
                  }))}
                  attendance={attendance}
                />
                <h3 className="mb-3 mt-8 font-sans text-xs font-semibold uppercase tracking-wider text-muted">
                  📊 Statistik Kehadiran
                </h3>
                <AttendanceStats members={members} sessions={sessions} attendance={attendance} />
              </section>
            ),
          },
          {
            id: "tugasan",
            label: "Tugasan",
            content: (
              <section>
                <h2 className={sectionTitle}>
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
                <TaskForm members={activeMembers.map((m) => ({ clerk_user_id: m.clerk_user_id, full_name: memberName(m.full_name, m.display_name) }))} />
                {tasks.length > 0 ? (
                  <div className="mt-4 flex flex-col gap-2">
                    {tasks.map((t) => (
                      <TaskAdminItem
                        key={t.id}
                        task={t}
                        members={activeMembers.map((m) => ({
                          clerk_user_id: m.clerk_user_id,
                          full_name: memberName(m.full_name, m.display_name),
                        }))}
                        assigneeName={
                          t.assigned_to
                            ? nameById.get(t.assigned_to) || "ahli"
                            : "Semua ahli"
                        }
                        summary={taskSummary(t)}
                        submissions={subsByTask.get(t.id) ?? []}
                        archived={isPastDue(t)}
                        defaultOpen={!isPastDue(t)}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 font-sans text-sm text-muted">Belum ada tugasan.</p>
                )}

                <h3 className="mb-4 mt-10 flex items-center gap-2 font-sans text-sm font-semibold uppercase tracking-wider text-muted">
                  <Inbox className="h-4 w-4" /> Semak Hantaran Tugasan
                </h3>
                <SubmissionsReview submissions={activeSubmissions} />
              </section>
            ),
          },
          {
            id: "penilaian",
            label: "Penilaian",
            content: (
              <section>
                <h2 className={sectionTitle}>
                  <Star className="h-4 w-4" /> Penilaian Pemain
                </h2>
                {playerMembers.length > 0 ? (
                  <AssessmentForm members={playerMembers} latest={latestAssessment} />
                ) : (
                  <p className="font-sans text-sm text-muted">Belum ada ahli untuk dinilai.</p>
                )}

                <h3 className="mb-4 mt-10 flex items-center gap-2 font-sans text-sm font-semibold uppercase tracking-wider text-muted">
                  <Activity className="h-4 w-4" /> Ujian Kecergasan
                </h3>
                {playerMembers.length > 0 ? (
                  <FitnessPanel members={playerMembers} history={fitnessByUser} />
                ) : (
                  <p className="font-sans text-sm text-muted">Belum ada ahli untuk diuji.</p>
                )}
              </section>
            ),
          },
          {
            id: "perlawanan",
            label: "Perlawanan",
            content: (
              <section>
                <h2 className={sectionTitle}>
                  <Swords className="h-4 w-4" /> Perlawanan
                </h2>
                {playerMembers.length > 0 ? (
                  <MatchPanel seasons={seasons} matches={matches} players={playerMembers} statsRows={matchStats} />
                ) : (
                  <p className="font-sans text-sm text-muted">Belum ada pemain.</p>
                )}
              </section>
            ),
          },
          {
            id: "laporan",
            label: "Laporan",
            content: (
              <section>
                <h2 className={sectionTitle}>Laporan Kemenjadian</h2>
                <ReportPanel players={reportPlayers} />
              </section>
            ),
          },
          {
            id: "pencapaian",
            label: "Pencapaian",
            content: (
              <section>
                <h2 className={sectionTitle}>
                  <Trophy className="h-4 w-4" /> Pencapaian
                </h2>
                <AchievementsPanel
                  players={playerMembers}
                  seasons={seasons}
                  achievements={achievements}
                />
              </section>
            ),
          },
          {
            id: "berita",
            label: "Berita",
            content: (
              <section>
                <h2 className={sectionTitle}>
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
            ),
          },
        ]}
      />
    </div>
  );
}
