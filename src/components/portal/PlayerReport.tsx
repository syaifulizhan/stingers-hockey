import type { Report } from "@/lib/report";

export default function PlayerReport({ name, report }: { name?: string; report: Report }) {
  return (
    <div className="rounded-2xl border border-amber/40 bg-amber/5 p-6">
      <h3 className="display mb-4 text-2xl text-paper">
        Laporan Kemenjadian{name ? `: ${name}` : ""}
      </h3>

      <div className="flex flex-col gap-5">
        <section>
          <h4 className="mb-2 font-sans text-sm font-semibold uppercase tracking-wider text-amber">
            Kekuatan
          </h4>
          <ul className="flex flex-col gap-1">
            {report.strengths.map((s, i) => (
              <li key={i} className="font-sans text-sm text-paper/90">
                • {s}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h4 className="mb-2 font-sans text-sm font-semibold uppercase tracking-wider text-amber">
            Perlu Diperbaiki
          </h4>
          <ul className="flex flex-col gap-1">
            {report.improvements.map((s, i) => (
              <li key={i} className="font-sans text-sm text-paper/90">
                • {s}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h4 className="mb-2 font-sans text-sm font-semibold uppercase tracking-wider text-amber">
            Cadangan Jurulatih
          </h4>
          <p className="font-sans text-sm text-paper/90">{report.recommendation}</p>
        </section>
      </div>
    </div>
  );
}
