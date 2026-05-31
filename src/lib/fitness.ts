// Metrik ujian kecergasan. lowerBetter = nilai lebih rendah lebih baik
// (cth: masa sprint). step = anak tangga input nombor.
export type FitnessMetric = {
  key: string;
  label: string;
  unit: string;
  lowerBetter: boolean;
  step: number;
};

export const FITNESS_METRICS: FitnessMetric[] = [
  { key: "sprint_20m", label: "Sprint 20m", unit: "s", lowerBetter: true, step: 0.01 },
  { key: "sprint_40m", label: "Sprint 40m", unit: "s", lowerBetter: true, step: 0.01 },
  { key: "illinois", label: "Illinois Agility", unit: "s", lowerBetter: true, step: 0.01 },
  { key: "beep_test", label: "Beep Test", unit: "lvl", lowerBetter: false, step: 0.1 },
  { key: "vertical_jump", label: "Vertical Jump", unit: "cm", lowerBetter: false, step: 0.5 },
  { key: "push_up", label: "Push-up", unit: "kali", lowerBetter: false, step: 1 },
  { key: "sit_up", label: "Sit-up", unit: "kali", lowerBetter: false, step: 1 },
  { key: "plank", label: "Plank", unit: "s", lowerBetter: false, step: 1 },
];

export const FITNESS_OCCASIONS = ["Bulanan", "Pemilihan Tournament"] as const;

// Rekod peribadi terbaik (PB) bagi satu metrik.
export function personalBest(metric: FitnessMetric, values: number[]): number | null {
  if (values.length === 0) return null;
  return metric.lowerBetter ? Math.min(...values) : Math.max(...values);
}
