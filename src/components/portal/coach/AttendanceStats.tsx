import { Trophy } from "lucide-react";
import { memberName } from "@/lib/names";

type Session = { id: string; type?: string };
type Member = {
  clerk_user_id: string;
  full_name: string | null;
  display_name?: string | null;
  role: string;
  banned: boolean;
};
type Attendance = { session_id: string; user_id: string; status: string };

// Statistik kehadiran automatik — dikira dari sesi + rekod kehadiran.
// "Hadir" = status 'present'. Penyebut = jumlah sesi bagi jenis berkenaan.
export default function AttendanceStats({
  members,
  sessions,
  attendance,
}: {
  members: Member[];
  sessions: Session[];
  attendance: Attendance[];
}) {
  const matchIds = new Set(
    sessions.filter((s) => s.type === "match").map((s) => s.id)
  );
  const totalTraining = sessions.length - matchIds.size;
  const totalMatch = matchIds.size;
  const totalSessions = sessions.length;

  // Kira hadir setiap ahli (latihan & perlawanan).
  const present = new Map<string, { training: number; match: number }>();
  for (const a of attendance) {
    if (a.status !== "present") continue;
    const cur = present.get(a.user_id) ?? { training: 0, match: 0 };
    if (matchIds.has(a.session_id)) cur.match += 1;
    else cur.training += 1;
    present.set(a.user_id, cur);
  }

  const rows = members
    .filter((m) => m.role === "member" && !m.banned)
    .map((m) => {
      const p = present.get(m.clerk_user_id) ?? { training: 0, match: 0 };
      const attended = p.training + p.match;
      const pct =
        totalSessions > 0 ? Math.round((attended / totalSessions) * 100) : 0;
      return { ...m, p, attended, pct };
    })
    .sort((a, b) => b.pct - a.pct || b.attended - a.attended);

  if (totalSessions === 0) {
    return (
      <p className="font-sans text-sm text-muted">
        Belum ada sesi. Cipta sesi di atas untuk mula kira statistik.
      </p>
    );
  }

  const topPct = rows[0]?.pct ?? 0;

  return (
    <div className="rounded-2xl border border-line bg-bg-soft/50 p-5">
      <div className="mb-4 flex flex-wrap gap-x-6 gap-y-1 font-sans text-xs text-muted">
        <span>
          Jumlah sesi: <span className="font-semibold text-paper">{totalSessions}</span>
        </span>
        <span>
          🏃 Latihan: <span className="font-semibold text-paper">{totalTraining}</span>
        </span>
        <span>
          🏑 Perlawanan: <span className="font-semibold text-paper">{totalMatch}</span>
        </span>
      </div>

      <div className="flex flex-col gap-2">
        {rows.map((r) => {
          const champ = r.pct > 0 && r.pct === topPct;
          return (
            <div key={r.clerk_user_id} className="flex flex-col gap-1">
              <div className="flex items-center justify-between gap-2 font-sans text-sm">
                <span className="flex min-w-0 items-center gap-1.5 text-paper">
                  {champ && <Trophy className="h-3.5 w-3.5 shrink-0 text-amber" />}
                  <span className="truncate">{memberName(r.full_name, r.display_name)}</span>
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  <span className="whitespace-nowrap text-xs text-muted">
                    🏃 {r.p.training}/{totalTraining} · 🏑 {r.p.match}/{totalMatch}
                  </span>
                  <span className="font-semibold tabular-nums text-amber">{r.pct}%</span>
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink">
                <div
                  className="h-full rounded-full bg-amber transition-all"
                  style={{ width: `${r.pct}%` }}
                />
              </div>
            </div>
          );
        })}
        {rows.length === 0 && (
          <p className="font-sans text-sm text-muted">Belum ada ahli.</p>
        )}
      </div>
    </div>
  );
}
