import type { SupabaseClient } from "@supabase/supabase-js";
import { assessmentAverage } from "@/lib/assessments";
import { preferredName } from "@/lib/names";

export type PlayerSummary = {
  id: string;
  name: string;
  isGoalkeeper: boolean;
  chips: { label: string; value: string }[];
};

// Ringkasan ringkas setiap ahli biasa (untuk jurulatih lihat di dashboard).
// Disusun: gol terbanyak dahulu, kemudian save terbanyak.
export async function buildPlayerSummaries(
  supabase: SupabaseClient
): Promise<PlayerSummary[]> {
  const [membersRes, assessRes, sessionsRes, attRes, matchStatsRes, achRes] =
    await Promise.all([
      supabase.from("users").select("clerk_user_id, full_name, display_name, role, banned, is_goalkeeper"),
      supabase.from("assessments").select("user_id, type, scores, assessed_on").order("assessed_on", { ascending: false }),
      supabase.from("sessions").select("id, type"),
      supabase.from("attendance").select("user_id, status"),
      supabase.from("match_stats").select("user_id, stats"),
      supabase.from("achievements").select("player_id"),
    ]);

  type M = {
    clerk_user_id: string;
    full_name: string | null;
    display_name: string | null;
    role: string;
    banned: boolean;
    is_goalkeeper: boolean;
  };
  const members = ((membersRes.data ?? []) as M[]).filter(
    (m) => m.role === "member" && !m.banned
  );

  // Penilaian terkini ikut user:type.
  const latest: Record<string, Record<string, number>> = {};
  for (const a of (assessRes.data ?? []) as { user_id: string; type: string; scores: Record<string, number> }[]) {
    const key = `${a.user_id}:${a.type}`;
    if (!latest[key]) latest[key] = a.scores ?? {};
  }

  const sessions = (sessionsRes.data ?? []) as { id: string; type: string }[];
  const totalSessions = sessions.length;
  const present = new Map<string, number>();
  for (const r of (attRes.data ?? []) as { user_id: string; status: string }[]) {
    if (r.status === "present") present.set(r.user_id, (present.get(r.user_id) ?? 0) + 1);
  }

  const goals = new Map<string, number>();
  const saves = new Map<string, number>();
  for (const s of (matchStatsRes.data ?? []) as { user_id: string; stats: Record<string, number> }[]) {
    goals.set(s.user_id, (goals.get(s.user_id) ?? 0) + (s.stats?.goals ?? 0));
    saves.set(s.user_id, (saves.get(s.user_id) ?? 0) + (s.stats?.save ?? 0));
  }

  const achCount = new Map<string, number>();
  for (const a of (achRes.data ?? []) as { player_id: string | null }[]) {
    if (a.player_id) achCount.set(a.player_id, (achCount.get(a.player_id) ?? 0) + 1);
  }

  return members
    .map((m) => {
      const id = m.clerk_user_id;
      const gk = !!m.is_goalkeeper;
      const skill = latest[`${id}:${gk ? "skill_gk" : "skill_field"}`];
      const coach = latest[`${id}:coach_eval`];
      const skillAvg = skill ? assessmentAverage(gk ? "skill_gk" : "skill_field", skill) : null;
      const coachAvg = coach ? assessmentAverage("coach_eval", coach) : null;
      const attPct =
        totalSessions > 0 ? Math.round(((present.get(id) ?? 0) / totalSessions) * 100) : null;
      const g = goals.get(id) ?? 0;
      const sv = saves.get(id) ?? 0;
      return {
        id,
        name: preferredName(m.full_name, m.display_name),
        isGoalkeeper: gk,
        _goals: g,
        _saves: sv,
        chips: [
          { label: "Kehadiran", value: attPct != null ? `${attPct}%` : "—" },
          { label: "Kemahiran", value: skillAvg != null ? `${skillAvg}/10` : "—" },
          { label: "Penilaian Jurulatih", value: coachAvg != null ? `${coachAvg}/10` : "—" },
          { label: gk ? "Save" : "Gol", value: String(gk ? sv : g) },
          { label: "Pencapaian", value: String(achCount.get(id) ?? 0) },
        ],
      };
    })
    .sort((a, b) => b._goals - a._goals || b._saves - a._saves || a.name.localeCompare(b.name))
    .map(({ _goals, _saves, ...rest }) => {
      void _goals;
      void _saves;
      return rest;
    });
}
