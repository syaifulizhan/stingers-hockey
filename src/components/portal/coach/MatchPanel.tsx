"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { matchMetrics, matchResult } from "@/lib/match";
import { memberName } from "@/lib/names";

const inputCls =
  "w-full rounded-lg border border-line bg-ink px-3 py-2 font-sans text-sm text-paper outline-none focus:border-amber";

type Match = {
  id: string;
  opponent: string;
  match_date: string | null;
  venue: string | null;
  competition: string | null;
  our_score: number | null;
  opp_score: number | null;
};
type Player = {
  clerk_user_id: string;
  full_name: string | null;
  display_name?: string | null;
  is_goalkeeper?: boolean;
};
type StatRow = { id: string; match_id: string; user_id: string; stats: Record<string, number> };

export default function MatchPanel({
  matches,
  players,
  statsRows,
}: {
  matches: Match[];
  players: Player[];
  statsRows: StatRow[];
}) {
  const router = useRouter();

  // ── Maklumat perlawanan baharu ──
  const [opponent, setOpponent] = useState("");
  const [matchDate, setMatchDate] = useState("");
  const [venue, setVenue] = useState("");
  const [competition, setCompetition] = useState("");
  const [ourScore, setOurScore] = useState("");
  const [oppScore, setOppScore] = useState("");
  const [creating, setCreating] = useState(false);

  // ── Rekod prestasi ──
  const [matchId, setMatchId] = useState(matches[0]?.id ?? "");
  const [playerId, setPlayerId] = useState(players[0]?.clerk_user_id ?? "");
  const [vals, setVals] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const nameById = useMemo(
    () => new Map(players.map((p) => [p.clerk_user_id, memberName(p.full_name, p.display_name)])),
    [players]
  );
  const gkById = useMemo(
    () => new Map(players.map((p) => [p.clerk_user_id, !!p.is_goalkeeper])),
    [players]
  );
  const statsByMatchUser = useMemo(() => {
    const m: Record<string, Record<string, number>> = {};
    for (const s of statsRows) m[`${s.match_id}:${s.user_id}`] = s.stats ?? {};
    return m;
  }, [statsRows]);

  const metrics = matchMetrics(!!gkById.get(playerId));

  // Pra-isi nilai bila tukar perlawanan/pemain.
  const prefill = useMemo(() => {
    const prev = statsByMatchUser[`${matchId}:${playerId}`] ?? {};
    const init: Record<string, string> = {};
    for (const mtr of metrics) init[mtr.key] = prev[mtr.key] != null ? String(prev[mtr.key]) : "";
    return init;
  }, [matchId, playerId, statsByMatchUser, metrics]);
  useEffect(() => {
    setVals(prefill);
    setMsg(null);
  }, [prefill]);

  const createMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (opponent.trim() === "") return;
    setCreating(true);
    try {
      const res = await fetch("/api/portal/coach/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          opponent,
          matchDate,
          venue,
          competition,
          ourScore: ourScore === "" ? null : Number(ourScore),
          oppScore: oppScore === "" ? null : Number(oppScore),
        }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setCreating(false);
      window.alert("Gagal cipta perlawanan.");
      return;
    }
    setOpponent("");
    setMatchDate("");
    setVenue("");
    setCompetition("");
    setOurScore("");
    setOppScore("");
    setCreating(false);
    router.refresh();
  };

  const deleteMatch = async (m: Match) => {
    if (!window.confirm(`Padam perlawanan lawan ${m.opponent}? Statistik pemain untuk match ini juga terpadam.`)) return;
    try {
      const res = await fetch(`/api/portal/coach/match?id=${m.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
    } catch {
      window.alert("Gagal padam.");
      return;
    }
    router.refresh();
  };

  const saveStat = async () => {
    if (!matchId || !playerId) return;
    const stats: Record<string, number> = {};
    for (const mtr of metrics) {
      const raw = vals[mtr.key];
      if (raw !== undefined && raw !== "") {
        const n = Number(raw);
        if (!Number.isNaN(n) && n >= 0) stats[mtr.key] = n;
      }
    }
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/portal/coach/match-stat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId, targetUserId: playerId, stats }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal");
      setMsg("✓ Prestasi disimpan.");
      router.refresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Gagal simpan.");
    } finally {
      setBusy(false);
    }
  };

  // Ringkasan statistik untuk perlawanan terpilih.
  const matchSummary = statsRows
    .filter((s) => s.match_id === matchId)
    .map((s) => ({
      name: nameById.get(s.user_id) || "Ahli",
      isGK: !!gkById.get(s.user_id),
      stats: s.stats ?? {},
    }));

  return (
    <div className="flex flex-col gap-8">
      {/* ── Maklumat perlawanan ── */}
      <div>
        <h3 className="mb-3 font-sans text-xs font-semibold uppercase tracking-wider text-muted">
          Maklumat Perlawanan
        </h3>
        <form onSubmit={createMatch} className="flex flex-col gap-3 rounded-xl border border-line bg-bg-soft/50 p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <input className={inputCls} placeholder="Lawan (cth: SMK Taman Desa)" value={opponent} onChange={(e) => setOpponent(e.target.value)} />
            <input className={inputCls} placeholder="Pertandingan (cth: MSSD)" value={competition} onChange={(e) => setCompetition(e.target.value)} />
            <input type="date" className={inputCls} value={matchDate} onChange={(e) => setMatchDate(e.target.value)} />
            <input className={inputCls} placeholder="Tempat" value={venue} onChange={(e) => setVenue(e.target.value)} />
            <div className="flex items-center gap-2">
              <span className="font-sans text-xs text-muted">Skor kita</span>
              <input type="number" min={0} className={inputCls} value={ourScore} onChange={(e) => setOurScore(e.target.value)} />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-sans text-xs text-muted">Skor lawan</span>
              <input type="number" min={0} className={inputCls} value={oppScore} onChange={(e) => setOppScore(e.target.value)} />
            </div>
          </div>
          <button
            type="submit"
            disabled={creating}
            className="self-start rounded-full bg-amber px-6 py-2.5 font-sans text-sm font-semibold uppercase tracking-wider text-ink transition-colors hover:bg-amber-deep disabled:opacity-60"
          >
            {creating ? "…" : "Tambah Perlawanan"}
          </button>
        </form>

        {matches.length > 0 && (
          <div className="mt-3 flex flex-col gap-1">
            {matches.map((m) => {
              const r = matchResult(m.our_score, m.opp_score);
              return (
                <div key={m.id} className="flex items-center justify-between gap-3 rounded-lg px-3 py-2 font-sans text-sm text-paper/90 hover:bg-bg-soft/50">
                  <span className="min-w-0">
                    vs {m.opponent}
                    <span className="text-muted">
                      {m.match_date ? ` · ${m.match_date}` : ""}
                      {m.competition ? ` · ${m.competition}` : ""}
                      {r ? ` · ${m.our_score}-${m.opp_score}` : ""}
                    </span>
                    {r && (
                      <span
                        className={`ml-2 rounded-full px-2 py-0.5 text-[0.65rem] font-semibold ${
                          r.tone === "win"
                            ? "bg-amber text-ink"
                            : r.tone === "draw"
                              ? "bg-paper/15 text-paper"
                              : "bg-red-500/20 text-red-400"
                        }`}
                      >
                        {r.label}
                      </span>
                    )}
                  </span>
                  <button
                    type="button"
                    onClick={() => deleteMatch(m)}
                    aria-label="Padam perlawanan"
                    className="shrink-0 rounded-md p-1.5 text-muted transition-colors hover:bg-amber/10 hover:text-amber"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Rekod prestasi pemain ── */}
      {matches.length === 0 ? (
        <p className="font-sans text-sm text-muted">
          Tambah perlawanan dahulu untuk merekod prestasi pemain.
        </p>
      ) : (
        <div>
          <h3 className="mb-3 font-sans text-xs font-semibold uppercase tracking-wider text-muted">
            Rekod Prestasi Pemain
          </h3>
          <div className="flex flex-col gap-4 rounded-xl border border-line bg-bg-soft/50 p-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block font-sans text-xs text-muted">Perlawanan</label>
                <select className={inputCls} value={matchId} onChange={(e) => setMatchId(e.target.value)}>
                  {matches.map((m) => (
                    <option key={m.id} value={m.id}>
                      vs {m.opponent}
                      {m.match_date ? ` (${m.match_date})` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block font-sans text-xs text-muted">Pemain</label>
                <select className={inputCls} value={playerId} onChange={(e) => setPlayerId(e.target.value)}>
                  {players.map((p) => (
                    <option key={p.clerk_user_id} value={p.clerk_user_id}>
                      {memberName(p.full_name, p.display_name)}
                      {p.is_goalkeeper ? " 🧤" : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {metrics.map((mtr) => (
                <div key={mtr.key} className="flex items-center gap-2">
                  <label className="w-40 shrink-0 font-sans text-xs text-paper/90">{mtr.label}</label>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={vals[mtr.key] ?? ""}
                    onChange={(e) => setVals((s) => ({ ...s, [mtr.key]: e.target.value }))}
                    placeholder="0"
                    className={inputCls}
                  />
                </div>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={saveStat}
                disabled={busy}
                className="rounded-full bg-amber px-6 py-2.5 font-sans text-sm font-semibold uppercase tracking-wider text-ink transition-colors hover:bg-amber-deep disabled:opacity-60"
              >
                {busy ? "Menyimpan…" : "Simpan Prestasi"}
              </button>
              {msg && <span className="font-sans text-xs text-paper/80">{msg}</span>}
            </div>
          </div>

          {/* Ringkasan perlawanan terpilih */}
          {matchSummary.length > 0 && (
            <div className="mt-4">
              <h4 className="mb-2 font-sans text-xs font-semibold uppercase tracking-wider text-muted">
                Statistik direkod
              </h4>
              <div className="flex flex-col gap-1">
                {matchSummary.map((row, i) => {
                  const parts = matchMetrics(row.isGK)
                    .filter((mtr) => (row.stats[mtr.key] ?? 0) > 0)
                    .map((mtr) => `${mtr.label}: ${row.stats[mtr.key]}`);
                  return (
                    <div key={i} className="rounded-lg px-3 py-1.5 font-sans text-sm text-paper/90">
                      <span className="font-medium">{row.name}</span>{" "}
                      <span className="text-muted">
                        {parts.length ? `— ${parts.join(", ")}` : "— (tiada statistik)"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
