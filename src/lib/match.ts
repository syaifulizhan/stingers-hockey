// Metrik prestasi perlawanan — berbeza untuk pemain padang vs penjaga gol.
export type MatchMetric = { key: string; label: string };

export const MATCH_FIELD_METRICS: MatchMetric[] = [
  { key: "goals", label: "Gol" },
  { key: "assists", label: "Assist" },
  { key: "shot_on_target", label: "Shot on Target" },
  { key: "tackle", label: "Successful Tackle" },
  { key: "interception", label: "Interception" },
  { key: "turnover", label: "Turnover" },
  { key: "green_card", label: "Kad Hijau" },
  { key: "yellow_card", label: "Kad Kuning" },
];

export const MATCH_GK_METRICS: MatchMetric[] = [
  { key: "save", label: "Save" },
  { key: "pc_save", label: "Penalty Corner Save" },
  { key: "clean_sheet", label: "Clean Sheet" },
  { key: "goals_conceded", label: "Goal Conceded" },
];

export function matchMetrics(isGK: boolean): MatchMetric[] {
  return isGK ? MATCH_GK_METRICS : MATCH_FIELD_METRICS;
}

export const ALL_MATCH_KEYS = [
  ...MATCH_FIELD_METRICS,
  ...MATCH_GK_METRICS,
].map((m) => m.key);

// Keputusan perlawanan dari skor.
export function matchResult(
  our?: number | null,
  opp?: number | null
): { label: string; tone: "win" | "loss" | "draw" } | null {
  if (our == null || opp == null) return null;
  if (our > opp) return { label: "Menang", tone: "win" };
  if (our < opp) return { label: "Kalah", tone: "loss" };
  return { label: "Seri", tone: "draw" };
}
