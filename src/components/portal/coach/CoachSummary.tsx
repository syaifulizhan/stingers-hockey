import { Users, TrendingUp, CalendarCheck, Goal, Hand, Trophy } from "lucide-react";

type Leader = { name: string; value: string } | null;
type Ranked = { name: string; score: number };
type Leaders = {
  mostImproved: Leader;
  bestAttendance: Leader;
  topScorer: Leader;
  bestGK: Leader;
};

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

// Satu baris pemenang (warna mengikut jantina, tanpa perkataan).
function WinnerRow({ data, accent }: { data: Leader; accent: "blue" | "pink" }) {
  const a = accents[accent];
  return (
    <div className="flex items-center gap-2">
      <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${a.dot}`} />
      {data ? (
        <span className="min-w-0 truncate font-sans text-sm text-paper">
          {data.name} <span className={`font-semibold ${a.score}`}>({data.value})</span>
        </span>
      ) : (
        <span className="font-sans text-sm text-muted">— Belum ada</span>
      )}
    </div>
  );
}

function GenderTop({ players, accent }: { players: Ranked[]; accent: keyof typeof accents }) {
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
  maleCount,
  femaleCount,
  leadersMale,
  leadersFemale,
  topMale,
  topFemale,
  topOther,
}: {
  totalPlayers: number;
  maleCount: number;
  femaleCount: number;
  leadersMale: Leaders;
  leadersFemale: Leaders;
  topMale: Ranked[];
  topFemale: Ranked[];
  topOther: Ranked[];
}) {
  // Kad pemenang — setiap satu papar pemenang lelaki (biru) & perempuan (pink).
  const awards = [
    { Icon: TrendingUp, label: "Paling Meningkat", male: leadersMale.mostImproved, female: leadersFemale.mostImproved },
    { Icon: CalendarCheck, label: "Paling Rajin Hadir", male: leadersMale.bestAttendance, female: leadersFemale.bestAttendance },
    { Icon: Goal, label: "Penjaring Terbanyak", male: leadersMale.topScorer, female: leadersFemale.topScorer },
    { Icon: Hand, label: "Goalkeeper Terbaik", male: leadersMale.bestGK, female: leadersFemale.bestGK },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {/* Jumlah pemain + pecahan jantina (warna sahaja) */}
        <div className="rounded-2xl border border-line bg-bg-soft/50 p-5">
          <div className="mb-2 flex items-center gap-2 font-sans text-xs font-semibold uppercase tracking-wider text-muted">
            <Users className="h-4 w-4 text-amber" /> Jumlah Pemain
          </div>
          <p className="display text-3xl text-amber">
            {totalPlayers} <span className="font-sans text-sm text-muted">berdaftar</span>
          </p>
          <div className="mt-2 flex items-center gap-4 font-sans text-sm">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-sky-400/80" />
              <span className="font-semibold text-sky-300 tabular-nums">{maleCount}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-pink-400/80" />
              <span className="font-semibold text-pink-300 tabular-nums">{femaleCount}</span>
            </span>
          </div>
        </div>

        {awards.map((c, i) => (
          <div key={i} className="rounded-2xl border border-line bg-bg-soft/50 p-5">
            <div className="mb-3 flex items-center gap-2 font-sans text-xs font-semibold uppercase tracking-wider text-muted">
              <c.Icon className="h-4 w-4 text-amber" /> {c.label}
            </div>
            <div className="flex flex-col gap-2">
              <WinnerRow data={c.male} accent="blue" />
              <WinnerRow data={c.female} accent="pink" />
            </div>
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
