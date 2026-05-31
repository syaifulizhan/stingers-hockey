import { Users, TrendingUp, CalendarCheck, Goal, Hand, Trophy } from "lucide-react";

type Leader = { name: string; value: string } | null;

export default function CoachSummary({
  totalPlayers,
  mostImproved,
  bestAttendance,
  topScorer,
  bestGK,
  top10,
}: {
  totalPlayers: number;
  mostImproved: Leader;
  bestAttendance: Leader;
  topScorer: Leader;
  bestGK: Leader;
  top10: { name: string; score: number }[];
}) {
  const cards = [
    { Icon: Users, label: "Jumlah Pemain", value: String(totalPlayers), sub: "berdaftar" },
    { Icon: TrendingUp, label: "Paling Meningkat", data: mostImproved },
    { Icon: CalendarCheck, label: "Paling Rajin Hadir", data: bestAttendance },
    { Icon: Goal, label: "Penjaring Terbanyak", data: topScorer },
    { Icon: Hand, label: "Goalkeeper Terbaik", data: bestGK },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c, i) => (
          <div key={i} className="rounded-2xl border border-line bg-bg-soft/50 p-5">
            <div className="mb-2 flex items-center gap-2 font-sans text-xs font-semibold uppercase tracking-wider text-muted">
              <c.Icon className="h-4 w-4 text-amber" /> {c.label}
            </div>
            {"value" in c && c.value !== undefined ? (
              <p className="display text-3xl text-amber">
                {c.value} <span className="font-sans text-sm text-muted">{c.sub}</span>
              </p>
            ) : c.data ? (
              <p className="font-sans text-base font-semibold text-paper">
                {c.data.name}{" "}
                <span className="font-normal text-amber">({c.data.value})</span>
              </p>
            ) : (
              <p className="font-sans text-sm text-muted">— Belum ada data</p>
            )}
          </div>
        ))}
      </div>

      {/* Top 10 keseluruhan */}
      <div className="rounded-2xl border border-line bg-bg-soft/50 p-5">
        <div className="mb-3 flex items-center gap-2 font-sans text-sm font-semibold uppercase tracking-wider text-muted">
          <Trophy className="h-4 w-4 text-amber" /> Top 10 Pemain Keseluruhan
        </div>
        <p className="mb-3 font-sans text-xs text-muted">
          Skor purata gabungan: kemahiran + penilaian jurulatih + kehadiran (skala 10).
        </p>
        {top10.length === 0 ? (
          <p className="font-sans text-sm text-muted">
            Belum cukup data (perlu penilaian / kehadiran).
          </p>
        ) : (
          <ol className="flex flex-col gap-1.5">
            {top10.map((p, i) => (
              <li
                key={i}
                className="flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 font-sans text-sm hover:bg-ink/40"
              >
                <span className="flex items-center gap-2 text-paper">
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      i === 0
                        ? "bg-amber text-ink"
                        : i < 3
                          ? "bg-amber/20 text-amber"
                          : "bg-paper/10 text-paper/70"
                    }`}
                  >
                    {i + 1}
                  </span>
                  {p.name}
                </span>
                <span className="font-semibold tabular-nums text-amber">{p.score}</span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
