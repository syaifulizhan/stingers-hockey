import { matchMetrics } from "@/lib/match";

type Row = {
  opponent: string;
  match_date: string | null;
  stats: Record<string, number>;
};

// Prestasi perlawanan ahli — jumlah keseluruhan + pecahan setiap match.
export default function MatchPerformance({
  isGK,
  rows,
}: {
  isGK: boolean;
  rows: Row[];
}) {
  const metrics = matchMetrics(isGK);

  if (rows.length === 0) {
    return (
      <p className="font-sans text-sm text-muted">Belum ada rekod perlawanan.</p>
    );
  }

  // Jumlah keseluruhan setiap metrik.
  const totals: Record<string, number> = {};
  for (const r of rows) {
    for (const m of metrics) totals[m.key] = (totals[m.key] ?? 0) + (r.stats[m.key] ?? 0);
  }

  const sorted = [...rows].sort((a, b) =>
    (b.match_date ?? "").localeCompare(a.match_date ?? "")
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Jumlah keseluruhan */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {metrics.map((m) => (
          <div
            key={m.key}
            className="rounded-xl border border-line bg-bg-soft/50 px-3 py-2.5 text-center"
          >
            <div className="display text-2xl text-amber">{totals[m.key] ?? 0}</div>
            <div className="font-sans text-[0.7rem] uppercase tracking-wide text-muted">
              {m.label}
            </div>
          </div>
        ))}
      </div>

      {/* Setiap perlawanan */}
      <div className="flex flex-col gap-2">
        {sorted.map((r, i) => {
          const parts = metrics
            .filter((m) => (r.stats[m.key] ?? 0) > 0)
            .map((m) => `${m.label}: ${r.stats[m.key]}`);
          return (
            <div
              key={i}
              className="rounded-lg border border-line bg-bg-soft/50 px-4 py-3 font-sans text-sm"
            >
              <p className="font-medium text-paper">
                vs {r.opponent}
                {r.match_date ? (
                  <span className="text-muted"> · {r.match_date}</span>
                ) : null}
              </p>
              <p className="mt-0.5 text-xs text-muted">
                {parts.length ? parts.join(" · ") : "Tiada statistik direkod"}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
