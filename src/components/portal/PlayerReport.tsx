import { Sparkles, TrendingUp, Target } from "lucide-react";
import type { Report } from "@/lib/report";

export default function PlayerReport({ name, report }: { name?: string; report: Report }) {
  return (
    <div className="rounded-2xl border border-amber/40 bg-amber/5 p-6">
      <div className="mb-4 flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-amber" />
        <h3 className="display text-2xl text-paper">
          Laporan Kemenjadian{name ? `: ${name}` : ""}
        </h3>
      </div>

      <div className="flex flex-col gap-5">
        <section>
          <h4 className="mb-2 flex items-center gap-1.5 font-sans text-sm font-semibold uppercase tracking-wider text-amber">
            <Sparkles className="h-4 w-4" /> Kekuatan (Strengths)
          </h4>
          <ul className="flex flex-col gap-1">
            {report.strengths.map((s, i) => (
              <li key={i} className="font-sans text-sm text-paper/90">• {s}</li>
            ))}
          </ul>
        </section>

        <section>
          <h4 className="mb-2 flex items-center gap-1.5 font-sans text-sm font-semibold uppercase tracking-wider text-amber">
            <TrendingUp className="h-4 w-4" /> Perlu Diperbaiki (Areas for Improvement)
          </h4>
          <ul className="flex flex-col gap-1">
            {report.improvements.map((s, i) => (
              <li key={i} className="font-sans text-sm text-paper/90">• {s}</li>
            ))}
          </ul>
        </section>

        <section>
          <h4 className="mb-2 flex items-center gap-1.5 font-sans text-sm font-semibold uppercase tracking-wider text-amber">
            <Target className="h-4 w-4" /> Cadangan Jurulatih (Coach Recommendation)
          </h4>
          <p className="font-sans text-sm text-paper/90">{report.recommendation}</p>
        </section>
      </div>
    </div>
  );
}
