"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Trophy, Star } from "lucide-react";
import { INDIVIDUAL_AWARDS, TEAM_AWARDS, type AchievementCategory } from "@/lib/achievements";
import { memberName } from "@/lib/names";

const inputCls =
  "w-full rounded-lg border border-line bg-ink px-3 py-2 font-sans text-sm text-paper outline-none focus:border-amber";

type Player = { clerk_user_id: string; full_name: string | null; display_name?: string | null };
type Season = { id: string; name: string; team: string };
type Achievement = {
  id: string;
  season_id: string | null;
  category: string;
  award: string;
  player_id: string | null;
  event: string | null;
};

export default function AchievementsPanel({
  players,
  seasons,
  achievements,
}: {
  players: Player[];
  seasons: Season[];
  achievements: Achievement[];
}) {
  const router = useRouter();
  const [category, setCategory] = useState<AchievementCategory>("individual");
  const [award, setAward] = useState("");
  const [playerId, setPlayerId] = useState(players[0]?.clerk_user_id ?? "");
  const [event, setEvent] = useState("");
  const [seasonId, setSeasonId] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const nameById = new Map(players.map((p) => [p.clerk_user_id, memberName(p.full_name, p.display_name)]));
  const seasonById = new Map(seasons.map((s) => [s.id, s.name]));

  const save = async () => {
    if (award.trim() === "") {
      setMsg("Sila isi anugerah.");
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/portal/coach/achievement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          award,
          playerId: category === "individual" ? playerId : "",
          event,
          seasonId: seasonId || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal");
      setMsg("✓ Pencapaian disimpan.");
      setAward("");
      setEvent("");
      router.refresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Gagal simpan.");
    } finally {
      setBusy(false);
    }
  };

  const del = async (id: string) => {
    if (!window.confirm("Padam pencapaian ini?")) return;
    try {
      const res = await fetch(`/api/portal/coach/achievement?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
    } catch {
      window.alert("Gagal padam.");
      return;
    }
    router.refresh();
  };

  const presets = category === "individual" ? INDIVIDUAL_AWARDS : TEAM_AWARDS;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 rounded-xl border border-line bg-bg-soft/50 p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block font-sans text-xs text-muted">Kategori</label>
            <select
              className={inputCls}
              value={category}
              onChange={(e) => {
                setCategory(e.target.value as AchievementCategory);
                setAward("");
              }}
            >
              <option value="individual">Individu</option>
              <option value="team">Pasukan</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block font-sans text-xs text-muted">Anugerah</label>
            <input
              className={inputCls}
              list="award-presets"
              placeholder="Cth: Pemain Terbaik / Johan"
              value={award}
              onChange={(e) => setAward(e.target.value)}
            />
            <datalist id="award-presets">
              {presets.map((p) => (
                <option key={p} value={p} />
              ))}
            </datalist>
          </div>
          {category === "individual" && (
            <div>
              <label className="mb-1.5 block font-sans text-xs text-muted">Pemain</label>
              <select className={inputCls} value={playerId} onChange={(e) => setPlayerId(e.target.value)}>
                {players.map((p) => (
                  <option key={p.clerk_user_id} value={p.clerk_user_id}>
                    {memberName(p.full_name, p.display_name)}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="mb-1.5 block font-sans text-xs text-muted">Acara (pilihan)</label>
            <input
              className={inputCls}
              placeholder="Cth: MSSD 2026"
              value={event}
              onChange={(e) => setEvent(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1.5 block font-sans text-xs text-muted">Season (pilihan)</label>
            <select className={inputCls} value={seasonId} onChange={(e) => setSeasonId(e.target.value)}>
              <option value="">— Tiada —</option>
              {seasons.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} — {s.team === "perempuan" ? "Perempuan" : "Lelaki"}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={save}
            disabled={busy}
            className="rounded-full bg-amber px-6 py-2.5 font-sans text-sm font-semibold uppercase tracking-wider text-ink transition-colors hover:bg-amber-deep disabled:opacity-60"
          >
            {busy ? "Menyimpan…" : "Tambah Pencapaian"}
          </button>
          {msg && <span className="font-sans text-xs text-paper/80">{msg}</span>}
        </div>
      </div>

      {achievements.length > 0 && (
        <div className="flex flex-col gap-1">
          {achievements.map((a) => (
            <div
              key={a.id}
              className="flex items-center justify-between gap-3 rounded-lg px-3 py-2 font-sans text-sm text-paper/90 hover:bg-bg-soft/50"
            >
              <span className="flex min-w-0 items-center gap-2">
                {a.category === "team" ? (
                  <Trophy className="h-4 w-4 shrink-0 text-amber" />
                ) : (
                  <Star className="h-4 w-4 shrink-0 text-amber" />
                )}
                <span className="truncate">
                  <span className="font-semibold">{a.award}</span>
                  {a.player_id && <span> — {nameById.get(a.player_id) || "Ahli"}</span>}
                  <span className="text-muted">
                    {a.event ? ` · ${a.event}` : ""}
                    {a.season_id ? ` · ${seasonById.get(a.season_id) ?? ""}` : ""}
                  </span>
                </span>
              </span>
              <button
                type="button"
                onClick={() => del(a.id)}
                aria-label="Padam"
                className="shrink-0 rounded-md p-1.5 text-muted transition-colors hover:bg-amber/10 hover:text-amber"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
