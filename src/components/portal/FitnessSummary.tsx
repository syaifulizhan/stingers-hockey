import { TrendingUp, TrendingDown } from "lucide-react";
import { FITNESS_METRICS, personalBest } from "@/lib/fitness";
import Sparkline from "@/components/portal/Sparkline";

type TestRow = { tested_on: string; results: Record<string, number> };

// Ringkasan kecergasan: PB + nilai terkini + graf peningkatan setiap metrik.
export default function FitnessSummary({ history }: { history: TestRow[] }) {
  const sorted = [...history].sort((a, b) => a.tested_on.localeCompare(b.tested_on));

  if (sorted.length === 0) {
    return (
      <p className="font-sans text-sm text-muted">
        Belum ada rekod ujian kecergasan.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {FITNESS_METRICS.map((m) => {
        const series = sorted
          .map((h) => h.results[m.key])
          .filter((v): v is number => typeof v === "number");
        if (series.length === 0) return null;

        const pb = personalBest(m, series);
        const latest = series[series.length - 1];
        const prev = series.length >= 2 ? series[series.length - 2] : null;
        const improved =
          prev === null ? null : m.lowerBetter ? latest < prev : latest > prev;
        const isNewPB = series.length > 1 && latest === pb;

        return (
          <div
            key={m.key}
            className="flex items-center gap-3 rounded-xl border border-line bg-bg-soft/50 px-4 py-3"
          >
            <div className="w-28 shrink-0">
              <p className="font-sans text-sm font-semibold text-paper">{m.label}</p>
              <p className="font-sans text-xs text-muted">
                PB: {pb}
                {m.unit}
              </p>
            </div>
            <div className="flex flex-1 justify-center">
              <Sparkline points={series} />
            </div>
            <div className="w-20 shrink-0 text-right">
              <p className="font-sans text-sm font-semibold text-amber">
                {latest}
                {m.unit}
              </p>
              {improved !== null && (
                <span
                  className={`inline-flex items-center gap-0.5 font-sans text-xs ${
                    improved ? "text-amber" : "text-muted"
                  }`}
                >
                  {improved ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {improved ? "lebih baik" : "turun"}
                </span>
              )}
              {isNewPB && (
                <p className="font-sans text-[0.65rem] font-semibold text-amber">
                  ⭐ Rekod baharu
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
