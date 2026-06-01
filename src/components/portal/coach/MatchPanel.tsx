"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Pencil, ChevronDown } from "lucide-react";
import { matchMetrics, matchResult, HOCKEY_POSITIONS } from "@/lib/match";
import { memberName } from "@/lib/names";

const inputCls =
  "w-full rounded-lg border border-line bg-ink px-3 py-2 font-sans text-sm text-paper outline-none focus:border-amber";

type Season = { id: string; name: string; closed: boolean; team: string };
type Match = {
  id: string;
  season_id: string | null;
  opponent: string;
  match_date: string | null;
  venue: string | null;
  competition: string | null;
  category: string | null;
  our_score: number | null;
  opp_score: number | null;
};

const teamLabel = (t?: string) => (t === "perempuan" ? "Perempuan" : "Lelaki");
type Player = {
  clerk_user_id: string;
  full_name: string | null;
  display_name?: string | null;
  is_goalkeeper?: boolean;
};
type StatRow = {
  id: string;
  match_id: string;
  user_id: string;
  position: string | null;
  stats: Record<string, number>;
};

export default function MatchPanel({
  seasons,
  matches,
  players,
  statsRows,
}: {
  seasons: Season[];
  matches: Match[];
  players: Player[];
  statsRows: StatRow[];
}) {
  const router = useRouter();

  const [seasonId, setSeasonId] = useState(
    seasons.find((s) => !s.closed)?.id ?? "" // lalai: season terbuka pertama
  );
  const [showClosed, setShowClosed] = useState(false);
  const [newSeason, setNewSeason] = useState("");
  const [newTeam, setNewTeam] = useState<"lelaki" | "perempuan">("lelaki");

  // Edit season sedia ada
  const [editingSeason, setEditingSeason] = useState(false);
  const [seasonName, setSeasonName] = useState("");
  const [seasonTeam, setSeasonTeam] = useState<"lelaki" | "perempuan">("lelaki");

  // Maklumat perlawanan baharu
  const [opponent, setOpponent] = useState("");
  const [matchDate, setMatchDate] = useState("");
  const [venue, setVenue] = useState("");
  const [competition, setCompetition] = useState("");
  const [category, setCategory] = useState("");
  const [ourScore, setOurScore] = useState("");
  const [oppScore, setOppScore] = useState("");
  const [creating, setCreating] = useState(false);

  // Edit perlawanan sedia ada
  const [editId, setEditId] = useState<string | null>(null);
  const [edit, setEdit] = useState({
    opponent: "",
    competition: "",
    category: "",
    matchDate: "",
    venue: "",
    ourScore: "",
    oppScore: "",
  });

  // Rekod prestasi
  const [matchId, setMatchId] = useState("");
  const [playerId, setPlayerId] = useState(players[0]?.clerk_user_id ?? "");
  const [position, setPosition] = useState("");
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
  const posByMatchUser = useMemo(() => {
    const m: Record<string, string> = {};
    for (const s of statsRows) m[`${s.match_id}:${s.user_id}`] = s.position ?? "";
    return m;
  }, [statsRows]);

  const seasonMatches = useMemo(
    () => matches.filter((m) => m.season_id === seasonId),
    [matches, seasonId]
  );

  // Reset pilihan match bila season tukar.
  useEffect(() => {
    setMatchId(seasonMatches[0]?.id ?? "");
  }, [seasonId]); // eslint-disable-line react-hooks/exhaustive-deps

  const metrics = matchMetrics(!!gkById.get(playerId));
  const prefill = useMemo(() => {
    const prev = statsByMatchUser[`${matchId}:${playerId}`] ?? {};
    const init: Record<string, string> = {};
    for (const mtr of metrics) init[mtr.key] = prev[mtr.key] != null ? String(prev[mtr.key]) : "";
    return init;
  }, [matchId, playerId, statsByMatchUser, metrics]);
  useEffect(() => {
    setVals(prefill);
    setPosition(posByMatchUser[`${matchId}:${playerId}`] ?? "");
    setMsg(null);
  }, [prefill, posByMatchUser, matchId, playerId]);

  const createSeason = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newSeason.trim() === "") return;
    try {
      const res = await fetch("/api/portal/coach/season", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newSeason, team: newTeam }),
      });
      if (!res.ok) throw new Error();
    } catch {
      window.alert("Gagal cipta season.");
      return;
    }
    setNewSeason("");
    router.refresh();
  };

  const toggleClosed = async () => {
    const s = seasons.find((x) => x.id === seasonId);
    if (!s) return;
    const closing = !s.closed;
    if (closing && !window.confirm(`Tutup season "${s.name}"? Ia akan keluar dari Live dan masuk ke halaman Keputusan.`)) return;
    try {
      const res = await fetch("/api/portal/coach/season", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: seasonId, closed: closing }),
      });
      if (!res.ok) throw new Error();
    } catch {
      window.alert("Gagal kemas kini season.");
      return;
    }
    router.refresh();
  };

  const startEditSeason = () => {
    const s = seasons.find((x) => x.id === seasonId);
    if (!s) return;
    setSeasonName(s.name);
    setSeasonTeam(s.team === "perempuan" ? "perempuan" : "lelaki");
    setEditingSeason(true);
  };

  const saveSeasonEdit = async () => {
    if (seasonName.trim() === "") return;
    try {
      const res = await fetch("/api/portal/coach/season", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: seasonId, name: seasonName, team: seasonTeam }),
      });
      if (!res.ok) throw new Error();
    } catch {
      window.alert("Gagal kemas kini season.");
      return;
    }
    setEditingSeason(false);
    router.refresh();
  };

  const deleteSeason = async () => {
    const s = seasons.find((x) => x.id === seasonId);
    if (!s) return;
    if (!window.confirm(`Padam season "${s.name}"? SEMUA perlawanan & statistik dalam season ini juga terpadam.`)) return;
    try {
      const res = await fetch(`/api/portal/coach/season?id=${seasonId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
    } catch {
      window.alert("Gagal padam season.");
      return;
    }
    router.refresh();
  };

  const createMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (opponent.trim() === "" || !seasonId) return;
    setCreating(true);
    try {
      const res = await fetch("/api/portal/coach/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          opponent,
          seasonId,
          matchDate,
          venue,
          competition,
          category,
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
    setCategory("");
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

  const startEdit = (m: Match) => {
    setEditId(m.id);
    setEdit({
      opponent: m.opponent,
      competition: m.competition ?? "",
      category: m.category ?? "",
      matchDate: m.match_date ?? "",
      venue: m.venue ?? "",
      ourScore: m.our_score == null ? "" : String(m.our_score),
      oppScore: m.opp_score == null ? "" : String(m.opp_score),
    });
  };

  const saveEdit = async (m: Match) => {
    if (edit.opponent.trim() === "") return;
    try {
      const res = await fetch("/api/portal/coach/match", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: m.id,
          opponent: edit.opponent,
          seasonId: m.season_id,
          competition: edit.competition,
          category: edit.category,
          matchDate: edit.matchDate,
          venue: edit.venue,
          ourScore: edit.ourScore === "" ? null : Number(edit.ourScore),
          oppScore: edit.oppScore === "" ? null : Number(edit.oppScore),
        }),
      });
      if (!res.ok) throw new Error();
    } catch {
      window.alert("Gagal kemas kini perlawanan.");
      return;
    }
    setEditId(null);
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
        body: JSON.stringify({ matchId, targetUserId: playerId, position, stats }),
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

  // ── Rumusan season ──
  const summary = useMemo(() => {
    const ids = new Set(seasonMatches.map((m) => m.id));
    let played = 0, win = 0, draw = 0, loss = 0, gf = 0, ga = 0;
    for (const m of seasonMatches) {
      const r = matchResult(m.our_score, m.opp_score);
      if (!r) continue;
      played++;
      gf += m.our_score ?? 0;
      ga += m.opp_score ?? 0;
      if (r.tone === "win") win++;
      else if (r.tone === "draw") draw++;
      else loss++;
    }
    const tot: Record<string, Record<string, number>> = {};
    for (const s of statsRows) {
      if (!ids.has(s.match_id)) continue;
      const acc = (tot[s.user_id] ??= {});
      for (const [k, v] of Object.entries(s.stats ?? {})) acc[k] = (acc[k] ?? 0) + v;
    }
    const leader = (key: string) => {
      let best: { name: string; value: number } | null = null;
      for (const [uid, m] of Object.entries(tot)) {
        const v = m[key] ?? 0;
        if (v > 0 && (!best || v > best.value)) best = { name: nameById.get(uid) || "Ahli", value: v };
      }
      return best;
    };
    return {
      played, win, draw, loss, gf, ga,
      topScorer: leader("goals"),
      topAssist: leader("assists"),
      topSave: leader("save"),
      topClean: leader("clean_sheet"),
    };
  }, [seasonMatches, statsRows, nameById]);

  const matchSummary = statsRows
    .filter((s) => s.match_id === matchId)
    .map((s) => ({
      name: nameById.get(s.user_id) || "Ahli",
      isGK: !!gkById.get(s.user_id),
      position: s.position ?? "",
      stats: s.stats ?? {},
    }));

  // Season ditutup dikuncupkan — hanya season terbuka kelihatan secara lalai.
  const closedCount = seasons.filter((s) => s.closed).length;
  const visibleSeasons = showClosed ? seasons : seasons.filter((s) => !s.closed);
  useEffect(() => {
    if (!showClosed && seasons.find((s) => s.id === seasonId)?.closed) {
      setSeasonId(seasons.find((s) => !s.closed)?.id ?? "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showClosed]);

  return (
    <div className="flex flex-col gap-8">
      {/* ── Season ── */}
      <div>
        <h3 className="mb-3 font-sans text-xs font-semibold uppercase tracking-wider text-muted">
          Season
        </h3>
        <form onSubmit={createSeason} className="mb-3 flex flex-col gap-2 sm:flex-row">
          <input
            className={inputCls}
            placeholder="Nama season baharu (cth: Musim 2026 / MSSD 2026)"
            value={newSeason}
            onChange={(e) => setNewSeason(e.target.value)}
          />
          <select
            className={`${inputCls} sm:w-44`}
            value={newTeam}
            onChange={(e) => setNewTeam(e.target.value as "lelaki" | "perempuan")}
          >
            <option value="lelaki">Lelaki</option>
            <option value="perempuan">Perempuan</option>
          </select>
          <button
            type="submit"
            className="shrink-0 rounded-full bg-amber px-6 py-2.5 font-sans text-sm font-semibold uppercase tracking-wider text-ink transition-colors hover:bg-amber-deep"
          >
            Cipta Season
          </button>
        </form>

        {closedCount > 0 && (
          <button
            type="button"
            onClick={() => setShowClosed((v) => !v)}
            className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 font-sans text-xs font-semibold text-amber transition-colors hover:border-amber"
          >
            <ChevronDown className={`h-4 w-4 transition-transform ${showClosed ? "rotate-180" : ""}`} />
            {showClosed ? "Sembunyikan season ditutup" : `Tunjuk season ditutup (${closedCount})`}
          </button>
        )}

        {seasons.length === 0 ? (
          <p className="font-sans text-sm text-muted">
            Cipta season dahulu untuk mula merekod perlawanan.
          </p>
        ) : visibleSeasons.length === 0 ? (
          <p className="font-sans text-sm text-muted">
            Tiada season aktif. Cipta season baharu di atas, atau tekan “Tunjuk season ditutup”.
          </p>
        ) : (
          <>
            {editingSeason ? (
              <div className="flex flex-col gap-2 rounded-lg border border-line bg-ink/40 p-3 sm:flex-row sm:items-center">
                <input
                  className={inputCls}
                  value={seasonName}
                  onChange={(e) => setSeasonName(e.target.value)}
                  placeholder="Nama season"
                />
                <select
                  className={`${inputCls} sm:w-44`}
                  value={seasonTeam}
                  onChange={(e) => setSeasonTeam(e.target.value as "lelaki" | "perempuan")}
                >
                  <option value="lelaki">Lelaki</option>
                  <option value="perempuan">Perempuan</option>
                </select>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={saveSeasonEdit}
                    className="rounded-full bg-amber px-5 py-2 font-sans text-xs font-semibold uppercase tracking-wider text-ink hover:bg-amber-deep"
                  >
                    Simpan
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingSeason(false)}
                    className="rounded-full border border-line px-4 py-2 font-sans text-xs text-paper hover:border-amber"
                  >
                    Batal
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <select className={inputCls} value={seasonId} onChange={(e) => setSeasonId(e.target.value)}>
                  {visibleSeasons.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} — {teamLabel(s.team)}
                      {s.closed ? " (Ditutup)" : ""}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={startEditSeason}
                  aria-label="Edit season"
                  className="shrink-0 rounded-lg border border-line p-2 text-muted transition-colors hover:border-amber hover:text-amber"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={toggleClosed}
                  className="shrink-0 whitespace-nowrap rounded-full border border-line px-4 py-2 font-sans text-xs font-semibold text-paper transition-colors hover:border-amber hover:text-amber"
                >
                  {seasons.find((s) => s.id === seasonId)?.closed ? "Buka Semula" : "Tutup Season"}
                </button>
                <button
                  type="button"
                  onClick={deleteSeason}
                  aria-label="Padam season"
                  className="shrink-0 rounded-lg border border-line p-2 text-muted transition-colors hover:border-red-500/50 hover:text-red-400"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )}
          </>
        )}

        {seasons.find((s) => s.id === seasonId)?.closed && (
          <p className="mt-2 font-sans text-xs text-muted">
            🔒 Season ditutup — dipaparkan di halaman <span className="text-paper/90">Keputusan</span>. Awak masih boleh semak, edit, rekod & padam di sini.
          </p>
        )}
      </div>

      {seasonId && (
        <>
          {/* ── Rumusan season ── */}
          <div>
            <h3 className="mb-3 font-sans text-xs font-semibold uppercase tracking-wider text-muted">
              Rumusan Season
            </h3>
            <div className="rounded-2xl border border-line bg-bg-soft/50 p-5">
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                {[
                  { l: "Main", v: summary.played },
                  { l: "Menang", v: summary.win },
                  { l: "Seri", v: summary.draw },
                  { l: "Kalah", v: summary.loss },
                  { l: "Jaring", v: summary.gf },
                  { l: "Kemasukan", v: summary.ga },
                ].map((x) => (
                  <div key={x.l} className="text-center">
                    <div className="display text-2xl text-amber">{x.v}</div>
                    <div className="font-sans text-[0.65rem] uppercase tracking-wide text-muted">{x.l}</div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex flex-col gap-1.5 border-t border-line pt-4 font-sans text-sm">
                <Leader label="Penjaring Terbanyak" data={summary.topScorer} unit="gol" />
                <Leader label="Assist Terbanyak" data={summary.topAssist} unit="assist" />
                <Leader label="Save Terbanyak" data={summary.topSave} unit="save" />
                <Leader label="Clean Sheet Terbanyak" data={summary.topClean} unit="clean sheet" />
              </div>
            </div>
          </div>

          {/* ── Maklumat perlawanan ── */}
          <div>
            <h3 className="mb-3 font-sans text-xs font-semibold uppercase tracking-wider text-muted">
              Maklumat Perlawanan
            </h3>
            <form onSubmit={createMatch} className="flex flex-col gap-3 rounded-xl border border-line bg-bg-soft/50 p-5">
              <div className="grid gap-3 sm:grid-cols-2">
                <input className={inputCls} placeholder="Lawan (cth: SMK Taman Desa)" value={opponent} onChange={(e) => setOpponent(e.target.value)} />
                <input className={inputCls} placeholder="Pertandingan (cth: MSSD)" value={competition} onChange={(e) => setCompetition(e.target.value)} />
                <input className={inputCls} placeholder="Kategori — pilihan (cth: Cup, Plate)" value={category} onChange={(e) => setCategory(e.target.value)} />
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

            {seasonMatches.length > 0 && (
              <div className="mt-3 flex flex-col gap-1">
                {seasonMatches.map((m) => {
                  const r = matchResult(m.our_score, m.opp_score);
                  if (editId === m.id) {
                    return (
                      <div key={m.id} className="flex flex-col gap-2 rounded-lg border border-line bg-ink/40 p-3">
                        <div className="grid gap-2 sm:grid-cols-2">
                          <input className={inputCls} placeholder="Lawan" value={edit.opponent} onChange={(e) => setEdit((s) => ({ ...s, opponent: e.target.value }))} />
                          <input className={inputCls} placeholder="Pertandingan" value={edit.competition} onChange={(e) => setEdit((s) => ({ ...s, competition: e.target.value }))} />
                          <input className={inputCls} placeholder="Kategori (cth: Cup)" value={edit.category} onChange={(e) => setEdit((s) => ({ ...s, category: e.target.value }))} />
                          <input type="date" className={inputCls} value={edit.matchDate} onChange={(e) => setEdit((s) => ({ ...s, matchDate: e.target.value }))} />
                          <input className={inputCls} placeholder="Tempat" value={edit.venue} onChange={(e) => setEdit((s) => ({ ...s, venue: e.target.value }))} />
                          <div className="flex items-center gap-2">
                            <input type="number" min={0} className={inputCls} placeholder="Skor kita" value={edit.ourScore} onChange={(e) => setEdit((s) => ({ ...s, ourScore: e.target.value }))} />
                            <input type="number" min={0} className={inputCls} placeholder="Skor lawan" value={edit.oppScore} onChange={(e) => setEdit((s) => ({ ...s, oppScore: e.target.value }))} />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button type="button" onClick={() => saveEdit(m)} className="rounded-full bg-amber px-5 py-1.5 font-sans text-xs font-semibold uppercase tracking-wider text-ink hover:bg-amber-deep">
                            Simpan
                          </button>
                          <button type="button" onClick={() => setEditId(null)} className="rounded-full border border-line px-4 py-1.5 font-sans text-xs text-paper hover:border-amber">
                            Batal
                          </button>
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div key={m.id} className="flex items-center justify-between gap-3 rounded-lg px-3 py-2 font-sans text-sm text-paper/90 hover:bg-bg-soft/50">
                      <span className="min-w-0">
                        vs {m.opponent}
                        <span className="text-muted">
                          {m.match_date ? ` · ${m.match_date}` : ""}
                          {m.competition ? ` · ${m.competition}` : ""}
                          {m.category ? ` · ${m.category}` : ""}
                          {r ? ` · ${m.our_score}-${m.opp_score}` : ""}
                        </span>
                        {r && (
                          <span
                            className={`ml-2 rounded-full px-2 py-0.5 text-[0.65rem] font-semibold ${
                              r.tone === "win" ? "bg-amber text-ink" : r.tone === "draw" ? "bg-paper/15 text-paper" : "bg-red-500/20 text-red-400"
                            }`}
                          >
                            {r.label}
                          </span>
                        )}
                      </span>
                      <span className="flex shrink-0 items-center gap-1">
                        <button
                          type="button"
                          onClick={() => startEdit(m)}
                          aria-label="Edit perlawanan"
                          className="rounded-md p-1.5 text-muted transition-colors hover:bg-amber/10 hover:text-amber"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteMatch(m)}
                          aria-label="Padam perlawanan"
                          className="rounded-md p-1.5 text-muted transition-colors hover:bg-amber/10 hover:text-amber"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Rekod prestasi ── */}
          {seasonMatches.length === 0 ? (
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
                      {seasonMatches.map((m) => (
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
                  <div>
                    <label className="mb-1.5 block font-sans text-xs text-muted">Posisi</label>
                    <select className={inputCls} value={position} onChange={(e) => setPosition(e.target.value)}>
                      <option value="">— Pilih posisi —</option>
                      {HOCKEY_POSITIONS.map((p) => (
                        <option key={p} value={p}>
                          {p}
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
                          <span className="font-medium">{row.name}</span>
                          {row.position && <span className="text-amber"> · {row.position}</span>}{" "}
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
        </>
      )}
    </div>
  );
}

function Leader({
  label,
  data,
  unit,
}: {
  label: string;
  data: { name: string; value: number } | null;
  unit: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted">{label}</span>
      <span className="text-paper">
        {data ? (
          <>
            <span className="font-semibold">{data.name}</span>{" "}
            <span className="text-amber">
              ({data.value} {unit})
            </span>
          </>
        ) : (
          <span className="text-muted">—</span>
        )}
      </span>
    </div>
  );
}
