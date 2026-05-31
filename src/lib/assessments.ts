// Definisi metrik penilaian — dikongsi oleh borang jurulatih & paparan ahli.

export type AssessmentType = "skill_field" | "skill_gk" | "coach_eval";

export const ASSESSMENT_TYPES: AssessmentType[] = [
  "skill_field",
  "skill_gk",
  "coach_eval",
];

export const ASSESSMENT_LABELS: Record<AssessmentType, string> = {
  skill_field: "Kemahiran Padang",
  skill_gk: "Kemahiran Penjaga Gol",
  coach_eval: "Penilaian Jurulatih",
};

export const ASSESSMENT_METRICS: Record<
  AssessmentType,
  { key: string; label: string }[]
> = {
  skill_field: [
    { key: "dribbling", label: "Dribbling" },
    { key: "indian_dribble", label: "Indian Dribble" },
    { key: "push_pass", label: "Push Pass" },
    { key: "hit", label: "Hit" },
    { key: "slap_hit", label: "Slap Hit" },
    { key: "reverse_stick", label: "Reverse Stick" },
    { key: "receiving", label: "Receiving" },
    { key: "tackling", label: "Tackling" },
    { key: "jinking", label: "Jinking" },
    { key: "shooting", label: "Shooting" },
  ],
  skill_gk: [
    { key: "kicking", label: "Kicking" },
    { key: "clearing", label: "Clearing" },
    { key: "diving", label: "Diving" },
    { key: "positioning", label: "Positioning" },
    { key: "communication", label: "Communication" },
    { key: "one_v_one", label: "1 vs 1" },
  ],
  coach_eval: [
    { key: "disiplin", label: "Disiplin" },
    { key: "kepimpinan", label: "Kepimpinan" },
    { key: "komunikasi", label: "Komunikasi" },
    { key: "kerjasama", label: "Kerjasama" },
    { key: "sikap", label: "Sikap" },
    { key: "fokus", label: "Fokus Latihan" },
    { key: "semangat", label: "Semangat Juang" },
  ],
};

// Purata skor (abaikan metrik yang tiada nilai).
export function assessmentAverage(
  type: AssessmentType,
  scores: Record<string, number>
): number {
  const vals = ASSESSMENT_METRICS[type]
    .map((m) => scores[m.key])
    .filter((v): v is number => typeof v === "number");
  if (vals.length === 0) return 0;
  return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
}
