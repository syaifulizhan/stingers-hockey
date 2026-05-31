import { ASSESSMENT_METRICS, type AssessmentType } from "@/lib/assessments";

export type ReportInput = {
  isGoalkeeper: boolean;
  skill: Record<string, number> | null; // penilaian kemahiran terkini (field/GK)
  coachEval: Record<string, number> | null; // penilaian jurulatih terkini
  attendancePct: number | null;
  matchTotals: Record<string, number>; // jumlah gol/assist/save dll.
};

export type Report = {
  strengths: string[];
  improvements: string[];
  recommendation: string;
};

// Analisis berasaskan peraturan (rule-based) — tiada AI, segera & percuma.
export function generateReport(input: ReportInput): Report {
  const strengths: string[] = [];
  const improvements: string[] = [];

  const skillType: AssessmentType = input.isGoalkeeper ? "skill_gk" : "skill_field";

  if (input.skill) {
    for (const m of ASSESSMENT_METRICS[skillType]) {
      const v = input.skill[m.key];
      if (typeof v !== "number") continue;
      if (v >= 8) strengths.push(`${m.label} sangat baik (${v}/10)`);
      else if (v >= 7) strengths.push(`${m.label} baik (${v}/10)`);
      else if (v <= 4) improvements.push(`${m.label} perlu dipertingkatkan (${v}/10)`);
    }
  }

  if (input.coachEval) {
    for (const m of ASSESSMENT_METRICS.coach_eval) {
      const v = input.coachEval[m.key];
      if (typeof v !== "number") continue;
      if (v >= 8) strengths.push(`${m.label} cemerlang (${v}/10)`);
      else if (v <= 4) improvements.push(`${m.label} perlu diberi perhatian (${v}/10)`);
    }
  }

  if (input.attendancePct != null) {
    if (input.attendancePct >= 80)
      strengths.push(`Kehadiran cemerlang (${input.attendancePct}%)`);
    else if (input.attendancePct < 60)
      improvements.push(`Kehadiran perlu ditingkatkan (${input.attendancePct}%)`);
  }

  const goals = input.matchTotals.goals ?? 0;
  const assists = input.matchTotals.assists ?? 0;
  const saves = input.matchTotals.save ?? 0;
  const cleanSheets = input.matchTotals.clean_sheet ?? 0;
  if (goals > 0) strengths.push(`Penyumbang gol (${goals} gol)`);
  if (assists > 0) strengths.push(`Pembekal assist (${assists} assist)`);
  if (input.isGoalkeeper && saves > 0) strengths.push(`Penyelamatan mantap (${saves} save)`);
  if (input.isGoalkeeper && cleanSheets > 0) strengths.push(`${cleanSheets} clean sheet`);

  let recommendation: string;
  if (input.isGoalkeeper) {
    recommendation = "Kekal dan perkukuh peranan sebagai Penjaga Gol.";
  } else if (input.skill) {
    const avg = (keys: string[]) => {
      const vals = keys
        .map((k) => input.skill![k])
        .filter((v): v is number => typeof v === "number");
      return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    };
    const attack = avg(["shooting", "dribbling", "jinking", "indian_dribble", "slap_hit"]);
    const midfield = avg(["push_pass", "receiving", "hit"]);
    const defence = avg(["tackling", "reverse_stick", "hit"]);
    const best = Math.max(attack, midfield, defence);
    if (best === 0)
      recommendation = "Teruskan latihan asas untuk membina kemahiran menyeluruh.";
    else if (best === attack)
      recommendation =
        "Sesuai dimainkan sebagai Penyerang (Forward) — manfaatkan kekuatan menyerang.";
    else if (best === defence)
      recommendation =
        "Sesuai dimainkan sebagai Pertahanan (Back/Half) — manfaatkan kekuatan bertahan.";
    else
      recommendation =
        "Sesuai dimainkan sebagai Pemain Tengah (Centre/Half) — kawalan & pengedaran bola.";
  } else {
    recommendation =
      "Belum cukup data penilaian — lengkapkan penilaian kemahiran untuk cadangan tepat.";
  }

  if (strengths.length === 0) strengths.push("Belum cukup data untuk kekuatan menonjol.");
  if (improvements.length === 0) improvements.push("Tiada kelemahan ketara — teruskan usaha! 👍");

  return { strengths, improvements, recommendation };
}
