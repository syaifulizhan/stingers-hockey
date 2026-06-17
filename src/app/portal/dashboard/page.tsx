import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import { Newspaper, ClipboardList, CalendarCheck, ChevronRight, Activity, Swords, Trophy } from "lucide-react";
import { createServerSupabase } from "@/lib/supabase/server";
import { ensureUserRow } from "@/lib/portal-auth";
import PlayerTaskList from "@/components/portal/PlayerTaskList";
import PortalNav from "@/components/portal/PortalNav";
import AssessmentScores from "@/components/portal/AssessmentScores";
import FitnessSummary from "@/components/portal/FitnessSummary";
import MatchPerformance from "@/components/portal/MatchPerformance";
import { ASSESSMENT_TYPES, assessmentAverage, type AssessmentType } from "@/lib/assessments";
import { memberName } from "@/lib/names";
import { generateReport } from "@/lib/report";
import ReportPreview from "@/components/portal/ReportPreview";
import PushToggle from "@/components/portal/PushToggle";
import SummaryChips from "@/components/portal/SummaryChips";
import CoachMemberSummary from "@/components/portal/CoachMemberSummary";
import { buildPlayerSummaries } from "@/lib/player-summaries";

// Lajur yang dikira untuk peratus "% lengkap" profil.
// Medan WAJIB untuk kira "% lengkap". Medan pilihan (catatan, tel. pemain,
// no. pendaftaran sekolah) TIDAK dikira.
const PROFILE_COLS = [
  "full_name",
  "year",
  "class",
  "date_of_birth",
  "gender",
  "ic_number",
  "school",
  "guardian_phone",
  "guardian_email",
  "experience",
  "position",
];

function filledCount(row: Record<string, unknown> | null) {
  if (!row) return 0;
  return PROFILE_COLS.filter((c) => {
    const v = row[c];
    return v !== null && v !== undefined && String(v).trim() !== "";
  }).length;
}

type NewsRow = { id: string; title: string; body: string | null; image_url: string | null; published_at: string };
type TaskRow = {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  assigned_to: string | null;
  exceptions: { uid: string; note: string }[] | null;
};
type SubmissionRow = {
  task_id: string;
  content: string | null;
  status: string;
  media_url: string | null;
};
type AttendanceRow = {
  status: string;
  created_at: string;
  sessions: { title: string; date: string | null } | null;
};

// Sentiasa render segar — elak Router Cache sajikan data lama selepas navigasi.
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  // Cipta baris ahli kalau belum ada (nampak di panel jurulatih serta-merta).
  await ensureUserRow();

  const user = await currentUser();
  const supabase = await createServerSupabase();

  const [profileRes, newsRes, tasksRes, subsRes, attRes, sessionsRes, myAttRes, myAssessRes, myFitnessRes, matchesRes, myMatchStatsRes, myAchievementsRes] =
    await Promise.all([
      supabase.from("users").select("*").eq("clerk_user_id", user!.id).maybeSingle(),
      supabase.from("news").select("*").order("published_at", { ascending: false }).limit(8),
      supabase.from("tasks").select("*").order("created_at", { ascending: false }),
      supabase.from("submissions").select("task_id, content, status, media_url, late"),
      supabase
        .from("attendance")
        .select("status, created_at, sessions(title, date)")
        .order("created_at", { ascending: false })
        .limit(8),
      supabase.from("sessions").select("id, type"),
      supabase.from("attendance").select("session_id, status"),
      supabase
        .from("assessments")
        .select("type, scores, assessed_on")
        .order("assessed_on", { ascending: false }),
      supabase
        .from("fitness_tests")
        .select("tested_on, results")
        .order("tested_on", { ascending: true }),
      supabase.from("matches").select("id, opponent, match_date"),
      supabase.from("match_stats").select("match_id, stats"),
      supabase
        .from("achievements")
        .select("award, event")
        .eq("player_id", user!.id)
        .order("created_at", { ascending: false }),
    ]);

  const profile = (profileRes.data ?? null) as Record<string, unknown> | null;
  const role = (profile?.role as string) ?? "member";
  const isCoachOrAdmin = role === "coach" || role === "admin";
  const news = (newsRes.data ?? []) as unknown as NewsRow[];
  const tasks = (tasksRes.data ?? []) as unknown as TaskRow[];
  const submissions = (subsRes.data ?? []) as unknown as SubmissionRow[];
  const attendance = (attRes.data ?? []) as unknown as AttendanceRow[];

  // Statistik kehadiran ahli ini (auto) — hadir = status 'present'.
  const allSessions = (sessionsRes.data ?? []) as { id: string; type: string }[];
  const myAtt = (myAttRes.data ?? []) as { session_id: string; status: string }[];
  const matchIds = new Set(allSessions.filter((s) => s.type === "match").map((s) => s.id));
  const totalTraining = allSessions.length - matchIds.size;
  const totalMatch = matchIds.size;
  const totalSessions = allSessions.length;
  let presentTraining = 0;
  let presentMatch = 0;
  for (const a of myAtt) {
    if (a.status !== "present") continue;
    if (matchIds.has(a.session_id)) presentMatch += 1;
    else presentTraining += 1;
  }
  const attendedTotal = presentTraining + presentMatch;
  const attendancePct =
    totalSessions > 0 ? Math.round((attendedTotal / totalSessions) * 100) : 0;

  // Penilaian terkini ahli ini, satu per jenis (data tersusun desc).
  const myAssessments = (myAssessRes.data ?? []) as {
    type: AssessmentType;
    scores: Record<string, number>;
    assessed_on: string;
  }[];
  const latestByType = new Map<
    AssessmentType,
    { scores: Record<string, number>; assessed_on: string }
  >();
  for (const a of myAssessments) {
    if (!latestByType.has(a.type))
      latestByType.set(a.type, { scores: a.scores ?? {}, assessed_on: a.assessed_on });
  }

  const myFitness = (myFitnessRes.data ?? []) as {
    tested_on: string;
    results: Record<string, number>;
  }[];

  // Prestasi perlawanan ahli ini (gabung stats dengan maklumat match).
  const allMatches = (matchesRes.data ?? []) as {
    id: string;
    opponent: string;
    match_date: string | null;
  }[];
  const matchById = new Map(allMatches.map((m) => [m.id, m]));
  const myMatchStats = (myMatchStatsRes.data ?? []) as {
    match_id: string;
    stats: Record<string, number>;
  }[];
  const myMatchRows = myMatchStats.map((s) => ({
    opponent: matchById.get(s.match_id)?.opponent ?? "Lawan",
    match_date: matchById.get(s.match_id)?.match_date ?? null,
    stats: s.stats ?? {},
  }));
  const isGoalkeeper = Boolean(profile?.is_goalkeeper);

  const myAchievements = (myAchievementsRes.data ?? []) as {
    award: string;
    event: string | null;
  }[];

  const baseName =
    (profile?.full_name as string) || user?.firstName || user?.username || "Ahli";
  const name = memberName(baseName, (profile?.display_name as string) ?? null);
  // Jurulatih: ringkasan semua ahli (untuk dropdown "Ringkasan Pemain").
  const playerSummaries = isCoachOrAdmin ? await buildPlayerSummaries(supabase) : [];
  // Peta nama ahli (untuk jurulatih lihat nama dalam arahan khas/pengecualian).
  const nameMap = new Map(playerSummaries.map((s) => [s.id, s.name]));
  const percent = profile
    ? Math.round((filledCount(profile) / PROFILE_COLS.length) * 100)
    : 0;

  // Ringkasan ringkas pemain (di atas dashboard).
  const skillAvg = latestByType.has("skill_field")
    ? assessmentAverage("skill_field", latestByType.get("skill_field")!.scores)
    : null;
  const gkAvg = latestByType.has("skill_gk")
    ? assessmentAverage("skill_gk", latestByType.get("skill_gk")!.scores)
    : null;
  const coachAvg = latestByType.has("coach_eval")
    ? assessmentAverage("coach_eval", latestByType.get("coach_eval")!.scores)
    : null;
  const totalGoals = myMatchRows.reduce((s, r) => s + (r.stats.goals ?? 0), 0);
  const totalSaves = myMatchRows.reduce((s, r) => s + (r.stats.save ?? 0), 0);
  const skillForRole = isGoalkeeper ? gkAvg : skillAvg;
  const summaryChips = [
    { label: "Kehadiran", value: totalSessions > 0 ? `${attendancePct}%` : "—" },
    { label: "Kemahiran", value: skillForRole != null ? `${skillForRole}/10` : "—" },
    { label: "Penilaian Jurulatih", value: coachAvg != null ? `${coachAvg}/10` : "—" },
    {
      label: isGoalkeeper ? "Save" : "Gol",
      value: myMatchRows.length ? String(isGoalkeeper ? totalSaves : totalGoals) : "—",
    },
    { label: "Pencapaian", value: String(myAchievements.length) },
  ];

  const myReport = generateReport({
    isGoalkeeper,
    skill: latestByType.get(isGoalkeeper ? "skill_gk" : "skill_field")?.scores ?? null,
    coachEval: latestByType.get("coach_eval")?.scores ?? null,
    attendancePct: totalSessions > 0 ? attendancePct : null,
    matchTotals: myMatchRows.reduce((acc, r) => {
      for (const [k, v] of Object.entries(r.stats)) acc[k] = (acc[k] ?? 0) + v;
      return acc;
    }, {} as Record<string, number>),
  });

  const subByTask = new Map(submissions.map((s) => [s.task_id, s]));

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      {/* Header */}
      <PortalNav />

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

      {/* Notifikasi push */}
      <div className="mt-6">
        <PushToggle />
      </div>

      {/* Kad: kelengkapan profil — hilang bila dah lengkap (100%) */}
      {percent < 100 && (
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
            Lengkapkan profil →
          </Link>
        </section>
      )}

      {/* Ringkasan Saya (ahli biasa) */}
      {!isCoachOrAdmin && (
        <section className="mt-6">
          <h2 className="mb-3 font-sans text-xs font-semibold uppercase tracking-wider text-muted">
            Ringkasan Saya
          </h2>
          <SummaryChips chips={summaryChips} />
        </section>
      )}

      {/* Ringkasan Pemain (jurulatih) — pilih ahli dari dropdown */}
      {isCoachOrAdmin && (
        <section className="mt-6">
          <h2 className="mb-3 font-sans text-xs font-semibold uppercase tracking-wider text-muted">
            Ringkasan Pemain
          </h2>
          <CoachMemberSummary players={playerSummaries} />
        </section>
      )}

      {/* Laporan kemenjadian (ahli sahaja) */}
      {!isCoachOrAdmin && (
        <section className="mt-8">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 font-sans text-sm font-semibold uppercase tracking-wider text-muted">
              Laporan Kemenjadian
            </h2>
            <Link
              href={`/portal/report/${user!.id}`}
              className="inline-flex items-center rounded-full bg-amber px-5 py-2 font-sans text-xs font-semibold uppercase tracking-wider text-ink transition-colors hover:bg-amber-deep"
            >
              Generate (Cetak A4)
            </Link>
          </div>
          <ReportPreview report={myReport} />
        </section>
      )}

      {/* Berita */}
      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-sans text-sm font-semibold uppercase tracking-wider text-muted">
            <Newspaper className="h-4 w-4" /> Berita Pasukan
          </h2>
          <Link
            href="/portal/news"
            className="font-sans text-xs font-semibold text-amber transition-colors hover:text-amber-deep"
          >
            Lihat semua →
          </Link>
        </div>
        {news.length > 0 ? (
          <div className="flex flex-col gap-2">
            {news.map((n) => (
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
                  <h3 className="truncate font-sans text-base font-semibold text-paper">
                    {n.title}
                  </h3>
                  <p className="font-sans text-xs text-muted">
                    {new Date(n.published_at).toLocaleDateString("ms-MY")}
                  </p>
                </div>
                {Date.now() - new Date(n.published_at).getTime() <
                  7 * 24 * 60 * 60 * 1000 && (
                  <span className="shrink-0 rounded-full bg-amber/20 px-2 py-0.5 font-sans text-[0.6rem] font-bold uppercase tracking-wide text-amber">
                    Baru
                  </span>
                )}
                <ChevronRight className="h-5 w-5 shrink-0 text-muted" />
              </Link>
            ))}
          </div>
        ) : (
          <p className="font-sans text-sm text-muted">Tiada berita buat masa ini.</p>
        )}
      </section>

      {/* Tugasan — ahli boleh hantar; jurulatih/admin baca sahaja (tak direkod) */}
      <section className="mt-8">
        <h2 className="mb-4 flex items-center gap-2 font-sans text-sm font-semibold uppercase tracking-wider text-muted">
          <ClipboardList className="h-4 w-4" /> Tugasan Latihan
        </h2>
        <PlayerTaskList
          items={tasks.map((t) => ({
            // Pangkas: JANGAN hantar senarai pengecualian penuh ke pelayar ahli —
            // hantar tugasan asas sahaja supaya nota ahli lain tak terdedah.
            task: { id: t.id, title: t.title, description: t.description, due_date: t.due_date },
            submission: subByTask.get(t.id) ?? null,
            // Pemain: arahan khas untuk DIA sahaja (jika dalam pengecualian).
            note: isCoachOrAdmin
              ? null
              : (t.exceptions ?? []).find((e) => e.uid === user!.id)?.note ?? null,
            // Jurulatih: nampak SEMUA arahan khas (nama + nota).
            exceptions: isCoachOrAdmin
              ? (t.exceptions ?? []).map((e) => ({
                  name: nameMap.get(e.uid) || "(tanpa nama)",
                  note: e.note,
                }))
              : undefined,
          }))}
          readOnly={isCoachOrAdmin}
        />
      </section>
      {isCoachOrAdmin && (
        <p className="mt-2 font-sans text-xs text-muted">
          Anda melihat tugasan sebagai jurulatih (baca sahaja — hantaran anda
          tidak direkod).
        </p>
      )}

      {/* Statistik kehadiran (auto) */}
      {!isCoachOrAdmin && totalSessions > 0 && (
        <section className="mt-8">
          <h2 className="mb-4 flex items-center gap-2 font-sans text-sm font-semibold uppercase tracking-wider text-muted">
            <CalendarCheck className="h-4 w-4" /> Statistik Kehadiran
          </h2>
          <div className="rounded-2xl border border-line bg-bg-soft/50 p-6">
            <div className="mb-2 flex items-center justify-between font-sans text-sm">
              <span className="text-paper/90">Peratus hadir keseluruhan</span>
              <span className="display text-2xl text-amber">{attendancePct}%</span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-ink">
              <div
                className="h-full rounded-full bg-amber transition-all"
                style={{ width: `${attendancePct}%` }}
              />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 font-sans text-sm">
              <div className="rounded-xl border border-line bg-ink/40 px-4 py-3">
                <div className="text-xs text-muted">🏃 Latihan</div>
                <div className="font-semibold text-paper">
                  {presentTraining}/{totalTraining} hadir
                </div>
              </div>
              <div className="rounded-xl border border-line bg-ink/40 px-4 py-3">
                <div className="text-xs text-muted">🏑 Perlawanan</div>
                <div className="font-semibold text-paper">
                  {presentMatch}/{totalMatch} hadir
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

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
                  className="flex items-center justify-between gap-3 rounded-lg border border-line bg-bg-soft/50 px-4 py-3"
                >
                  <span className="min-w-0 truncate font-sans text-sm text-paper/90">
                    {a.sessions?.title ?? "Sesi latihan"}
                    {a.sessions?.date ? ` — ${a.sessions.date}` : ""}
                  </span>
                  <span
                    className={`shrink-0 font-sans text-xs font-semibold uppercase ${
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

      {/* Penilaian terkini */}
      {!isCoachOrAdmin && latestByType.size > 0 && (
        <section className="mt-8">
          <h2 className="mb-4 flex items-center gap-2 font-sans text-sm font-semibold uppercase tracking-wider text-muted">
            ⭐ Penilaian Terkini
          </h2>
          <div className="flex flex-col gap-4">
            {ASSESSMENT_TYPES.filter((t) => latestByType.has(t)).map((t) => {
              const a = latestByType.get(t)!;
              return (
                <AssessmentScores
                  key={t}
                  type={t as AssessmentType}
                  scores={a.scores}
                  assessedOn={a.assessed_on}
                />
              );
            })}
          </div>
        </section>
      )}

      {/* Ujian kecergasan (PB + graf) */}
      {!isCoachOrAdmin && myFitness.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-4 flex items-center gap-2 font-sans text-sm font-semibold uppercase tracking-wider text-muted">
            <Activity className="h-4 w-4" /> Ujian Kecergasan
          </h2>
          <FitnessSummary history={myFitness} />
        </section>
      )}

      {/* Pencapaian */}
      {!isCoachOrAdmin && myAchievements.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-4 flex items-center gap-2 font-sans text-sm font-semibold uppercase tracking-wider text-muted">
            <Trophy className="h-4 w-4" /> Pencapaian
          </h2>
          <div className="flex flex-col gap-2">
            {myAchievements.map((a, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-xl border border-amber/40 bg-amber/5 px-4 py-3"
              >
                <Trophy className="h-5 w-5 shrink-0 text-amber" />
                <span className="font-sans text-sm text-paper">
                  <span className="font-semibold">{a.award}</span>
                  {a.event ? <span className="text-muted"> · {a.event}</span> : null}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Prestasi perlawanan */}
      {!isCoachOrAdmin && myMatchRows.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-4 flex items-center gap-2 font-sans text-sm font-semibold uppercase tracking-wider text-muted">
            <Swords className="h-4 w-4" /> Prestasi Perlawanan
          </h2>
          <MatchPerformance isGK={isGoalkeeper} rows={myMatchRows} />
        </section>
      )}
    </div>
  );
}
