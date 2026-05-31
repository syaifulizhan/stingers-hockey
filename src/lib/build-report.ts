import type { SupabaseClient } from "@supabase/supabase-js";
import { ASSESSMENT_METRICS } from "@/lib/assessments";
import { FITNESS_METRICS, personalBest } from "@/lib/fitness";
import { generateReport, type Report } from "@/lib/report";
import { memberName } from "@/lib/names";

export type ReportData = {
  name: string;
  age: number | null;
  dob: string | null;
  gender: string | null;
  position: string | null;
  yearClass: string | null;
  isGoalkeeper: boolean;
  skillTitle: string;
  skill: { label: string; score: number | null }[];
  coachEval: { label: string; score: number | null }[];
  fitness: { label: string; unit: string; latest: number | null; pb: number | null }[];
  attendance: {
    pct: number | null;
    trainPresent: number;
    trainTotal: number;
    matchPresent: number;
    matchTotal: number;
  };
  matchTotals: Record<string, number>;
  report: Report;
  generatedOn: string;
};

function ageFrom(dob: string | null): number | null {
  if (!dob) return null;
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  let a = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) a--;
  return a >= 0 && a < 120 ? a : null;
}

export async function buildReportData(
  supabase: SupabaseClient,
  userId: string
): Promise<ReportData | null> {
  const [profileRes, assessRes, fitnessRes, sessionsRes, attRes, matchStatsRes] =
    await Promise.all([
      supabase.from("users").select("*").eq("clerk_user_id", userId).maybeSingle(),
      supabase
        .from("assessments")
        .select("type, scores, assessed_on")
        .eq("user_id", userId)
        .order("assessed_on", { ascending: false }),
      supabase
        .from("fitness_tests")
        .select("results, tested_on")
        .eq("user_id", userId)
        .order("tested_on", { ascending: true }),
      supabase.from("sessions").select("id, type"),
      supabase.from("attendance").select("session_id, status").eq("user_id", userId),
      supabase.from("match_stats").select("stats").eq("user_id", userId),
    ]);

  const p = profileRes.data as Record<string, unknown> | null;
  if (!p) return null;

  const isGoalkeeper = Boolean(p.is_goalkeeper);
  const name = memberName(p.full_name as string | null, p.display_name as string | null);

  // Penilaian terkini ikut jenis.
  const latest: Record<string, Record<string, number>> = {};
  for (const a of (assessRes.data ?? []) as { type: string; scores: Record<string, number> }[]) {
    if (!latest[a.type]) latest[a.type] = a.scores ?? {};
  }
  const skillType = isGoalkeeper ? "skill_gk" : "skill_field";
  const skillScores = latest[skillType] ?? {};
  const skill = ASSESSMENT_METRICS[skillType].map((m) => ({
    label: m.label,
    score: typeof skillScores[m.key] === "number" ? skillScores[m.key] : null,
  }));
  const coachScores = latest["coach_eval"] ?? {};
  const coachEval = ASSESSMENT_METRICS.coach_eval.map((m) => ({
    label: m.label,
    score: typeof coachScores[m.key] === "number" ? coachScores[m.key] : null,
  }));

  // Kecergasan: terkini + PB.
  const fitnessRows = (fitnessRes.data ?? []) as { results: Record<string, number> }[];
  const fitness = FITNESS_METRICS.map((m) => {
    const series = fitnessRows
      .map((r) => r.results?.[m.key])
      .filter((v): v is number => typeof v === "number");
    return {
      label: m.label,
      unit: m.unit,
      latest: series.length ? series[series.length - 1] : null,
      pb: personalBest(m, series),
    };
  });

  // Kehadiran (latihan vs perlawanan).
  const sessions = (sessionsRes.data ?? []) as { id: string; type: string }[];
  const matchIds = new Set(sessions.filter((s) => s.type === "match").map((s) => s.id));
  const trainTotal = sessions.length - matchIds.size;
  const matchTotal = matchIds.size;
  let trainPresent = 0;
  let matchPresent = 0;
  for (const a of (attRes.data ?? []) as { session_id: string; status: string }[]) {
    if (a.status !== "present") continue;
    if (matchIds.has(a.session_id)) matchPresent++;
    else trainPresent++;
  }
  const totalSessions = sessions.length;
  const pct =
    totalSessions > 0 ? Math.round(((trainPresent + matchPresent) / totalSessions) * 100) : null;

  // Jumlah statistik perlawanan.
  const matchTotals: Record<string, number> = {};
  for (const s of (matchStatsRes.data ?? []) as { stats: Record<string, number> }[]) {
    for (const [k, v] of Object.entries(s.stats ?? {})) matchTotals[k] = (matchTotals[k] ?? 0) + v;
  }

  const report = generateReport({
    isGoalkeeper,
    skill: latest[skillType] ?? null,
    coachEval: latest["coach_eval"] ?? null,
    attendancePct: pct,
    matchTotals,
  });

  const yearParts = [p.year as string | null, p.class as string | null].filter(Boolean);

  return {
    name,
    age: ageFrom(p.date_of_birth as string | null),
    dob: (p.date_of_birth as string | null) ?? null,
    gender: (p.gender as string | null) ?? null,
    position: (p.position as string | null) ?? null,
    yearClass: yearParts.length ? yearParts.join(" / ") : null,
    isGoalkeeper,
    skillTitle: isGoalkeeper ? "Kemahiran Penjaga Gol" : "Kemahiran Padang",
    skill,
    coachEval,
    fitness,
    attendance: { pct, trainPresent, trainTotal, matchPresent, matchTotal },
    matchTotals,
    report,
    generatedOn: new Date().toLocaleDateString("ms-MY", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
  };
}
