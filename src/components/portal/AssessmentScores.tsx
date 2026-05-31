import {
  ASSESSMENT_METRICS,
  ASSESSMENT_LABELS,
  assessmentAverage,
  type AssessmentType,
} from "@/lib/assessments";

// Paparan skor penilaian (bar 1–10). Digunakan di dashboard ahli & panel.
export default function AssessmentScores({
  type,
  scores,
  assessedOn,
}: {
  type: AssessmentType;
  scores: Record<string, number>;
  assessedOn?: string | null;
}) {
  const metrics = ASSESSMENT_METRICS[type];
  const avg = assessmentAverage(type, scores);

  return (
    <div className="rounded-2xl border border-line bg-bg-soft/50 p-5">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="font-sans text-sm font-semibold text-paper">
            {ASSESSMENT_LABELS[type]}
          </h3>
          {assessedOn && (
            <p className="font-sans text-xs text-muted">Terkini: {assessedOn}</p>
          )}
        </div>
        <span className="display text-2xl text-amber">
          {avg}
          <span className="text-sm text-muted">/10</span>
        </span>
      </div>

      <div className="flex flex-col gap-2">
        {metrics.map((m) => {
          const v = scores[m.key];
          const has = typeof v === "number";
          return (
            <div key={m.key} className="flex items-center gap-3">
              <span className="w-32 shrink-0 font-sans text-xs text-paper/90">
                {m.label}
              </span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-ink">
                <div
                  className="h-full rounded-full bg-amber transition-all"
                  style={{ width: has ? `${(v / 10) * 100}%` : "0%" }}
                />
              </div>
              <span className="w-8 shrink-0 text-right font-sans text-xs font-semibold tabular-nums text-paper">
                {has ? v : "—"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
