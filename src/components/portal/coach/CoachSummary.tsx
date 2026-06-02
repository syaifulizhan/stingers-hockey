import { Users, TrendingUp, CalendarCheck, Goal, Hand, Trophy } from "lucide-react";

type Leader = { name: string; value: string } | null;
type Ranked = { name: string; score: number };

// Gaya warna lembut ikut jantina (biru = lelaki, pink = perempuan) — sengaja
// tanpa perkataan, lembut untuk mata jurulatih.
const accents = {
  blue: {
    box: "border-sky-400/25 bg-sky-400/[0.06]",
    dot: "bg-sky-400/80",
    first: "bg-sky-400/80 text-ink",
    rank: "bg-sky-400/20 text-sky-200",
    score: "text-sky-300",
  },
  pink: {
    box: "border-pink-400/25 bg-pink-400/[0.06]",
    dot: "bg-pink-400/80",
    first: "bg-pink-400/80 text-ink",
    rank: "bg-pink-400/20 text-pink-200",
    score: "text-pink-300",
  },
  neutral: {
    box: "border-line bg-bg-soft/50",
    dot: "bg-paper/40",
    first: "bg-amber text-ink",
    rank: "bg-paper/10 text-paper/70",
    score: "text-amber",
  },
} as const;

function GenderTop({
  players,
  accent,
}: {
  players: Ranked[];
  accent: keyof typeof accents;
}) {
  const a = accents[accent];
  return (
    <div className={`rounded-xl border p-4 ${a.box}`}>
      {/* Penanda warna (tanpa perkataan jantina) */}
      <span className={`mb-3 block h-1.5 w-10 rounded-full ${a.dot}`} />
      {players.length === 0 ? (
        <p className="font-sans text-sm text-muted">Belum cukup data.</p>
      ) : (
        <ol className="flex flex-col gap-1.5">
          {players.map((p, i) => (
            <li
              key={i}
              className="flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 font-sans text-sm hover:bg-ink/40"
            >
              <span className="flex min-w-0 items-center gap-2 text-paper">
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    i === 0 ? a.first : a.rank
                  }`}
                >
                  {i + 1}
                </span>
                <span className="truncate">{p.name}</span>
              </span>
              <span className={`shrink-0 font-semibold tabular-nums ${a.score}`}>{p.score}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

export default function CoachSummary({
  totalPlayers,
  mostImproved,
  bestAttendance,
  topScorer,
  bestGK,
  topMale,
  topFemale,
  topOther,
}: {
  totalPlayers: number;
  mostImproved: Leader;
  bestAttendance: Leader;
  topScorer: Leader;
  bestGK: Leader;
  topMale: Ranked[];
  topFemale: Ranked[];
  topOther: Ranked[];
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

      {/* Top pemain — diasingkan ikut jantina (warna biru/pink) supaya adil */}
      <div className="rounded-2xl border border-line bg-bg-soft/50 p-5">
        <div className="mb-3 flex items-center gap-2 font-sans text-sm font-semibold uppercase tracking-wider text-muted">
          <Trophy className="h-4 w-4 text-amber" /> Top Pemain
        </div>
        <p className="mb-4 font-sans text-xs text-muted">
          Skor purata gabungan: kemahiran + penilaian jurulatih + kehadiran (skala 10).
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <GenderTop players={topMale} accent="blue" />
          <GenderTop players={topFemale} accent="pink" />
        </div>
        {topOther.length > 0 && (
          <div className="mt-3">
            <GenderTop players={topOther} accent="neutral" />
          </div>
        )}
      </div>
    </div>
  );
}
