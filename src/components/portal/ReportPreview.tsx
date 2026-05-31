import type { Report } from "@/lib/report";

// Paparan laporan dalam tema portal (bukan versi cetak A4).
export default function ReportPreview({ report }: { report: Report }) {
  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-line bg-bg-soft/50 p-6">
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
  );
}
