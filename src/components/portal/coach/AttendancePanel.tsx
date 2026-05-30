"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const inputCls =
  "w-full rounded-lg border border-line bg-ink px-4 py-3 font-sans text-sm text-paper placeholder:text-muted/60 outline-none focus:border-amber";

type Session = { id: string; title: string; date: string | null };
type Member = { clerk_user_id: string; full_name: string | null };
type Attendance = { session_id: string; user_id: string; status: string };

const STATUSES: { value: "present" | "absent" | "excused"; label: string }[] = [
  { value: "present", label: "Hadir" },
  { value: "absent", label: "Tidak" },
  { value: "excused", label: "Dimaaf" },
];

export default function AttendancePanel({
  sessions,
  members,
  attendance,
}: {
  sessions: Session[];
  members: Member[];
  attendance: Attendance[];
}) {
  const router = useRouter();
  const [newTitle, setNewTitle] = useState("");
  const [newDate, setNewDate] = useState("");
  const [creating, setCreating] = useState(false);
  const [selectedId, setSelectedId] = useState(sessions[0]?.id ?? "");

  // Peta status tempatan: "sessionId:userId" → status.
  const initialMap = useMemo(() => {
    const m: Record<string, string> = {};
    for (const a of attendance) m[`${a.session_id}:${a.user_id}`] = a.status;
    return m;
  }, [attendance]);
  const [statusMap, setStatusMap] = useState<Record<string, string>>(initialMap);

  // Edit sesi terpilih
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDate, setEditDate] = useState("");

  const startEdit = () => {
    const s = sessions.find((x) => x.id === selectedId);
    if (!s) return;
    setEditTitle(s.title);
    setEditDate(s.date ?? "");
    setEditing(true);
  };

  const saveEdit = async () => {
    if (editTitle.trim() === "") return;
    try {
      const res = await fetch("/api/portal/coach/session", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedId, title: editTitle, date: editDate }),
      });
      if (!res.ok) throw new Error();
    } catch {
      window.alert("Gagal kemas kini sesi.");
      return;
    }
    setEditing(false);
    router.refresh();
  };

  const deleteSession = async () => {
    const s = sessions.find((x) => x.id === selectedId);
    if (!s) return;
    if (!window.confirm(`Padam sesi "${s.title}"? Rekod kehadiran untuk sesi ini juga akan terpadam.`))
      return;
    try {
      const res = await fetch(`/api/portal/coach/session?id=${selectedId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
    } catch {
      window.alert("Gagal padam sesi.");
      return;
    }
    router.refresh();
  };

  const createSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newTitle.trim() === "") return;
    setCreating(true);
    try {
      const res = await fetch("/api/portal/coach/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle, date: newDate }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setCreating(false);
      window.alert("Gagal cipta sesi.");
      return;
    }
    setNewTitle("");
    setNewDate("");
    setCreating(false);
    router.refresh();
  };

  const mark = async (
    memberId: string,
    status: "present" | "absent" | "excused"
  ) => {
    if (!selectedId) return;
    const key = `${selectedId}:${memberId}`;
    const prev = statusMap[key];
    setStatusMap((m) => ({ ...m, [key]: status })); // optimistik
    try {
      const res = await fetch("/api/portal/coach/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: selectedId, userId: memberId, status }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setStatusMap((m) => ({ ...m, [key]: prev })); // patah balik
      window.alert("Gagal simpan kehadiran.");
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Cipta sesi */}
      <form
        onSubmit={createSession}
        className="flex flex-col gap-3 rounded-xl border border-line bg-bg-soft/50 p-5 sm:flex-row sm:items-end"
      >
        <div className="flex-1">
          <label className="mb-1.5 block font-sans text-xs text-muted">Tajuk sesi</label>
          <input
            className={inputCls}
            placeholder="Cth: Latihan Rabu / Perlawanan KATMO"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1.5 block font-sans text-xs text-muted">Tarikh</label>
          <input
            type="date"
            className={inputCls}
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
          />
        </div>
        <button
          type="submit"
          disabled={creating}
          className="rounded-full bg-amber px-6 py-3 font-sans text-sm font-semibold uppercase tracking-wider text-ink transition-colors hover:bg-amber-deep disabled:opacity-60"
        >
          {creating ? "…" : "Cipta Sesi"}
        </button>
      </form>

      {sessions.length === 0 ? (
        <p className="font-sans text-sm text-muted">
          Belum ada sesi. Cipta satu di atas untuk mula rekod kehadiran.
        </p>
      ) : (
        <>
          {/* Pilih sesi */}
          <div>
            <label className="mb-1.5 block font-sans text-xs text-muted">Pilih sesi</label>
            <select
              className={inputCls}
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
            >
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                  {s.date ? ` — ${s.date}` : ""}
                </option>
              ))}
            </select>

            {/* Edit / padam sesi terpilih */}
            {editing ? (
              <div className="mt-3 flex flex-col gap-2 rounded-lg border border-line bg-ink/40 p-3 sm:flex-row sm:items-end">
                <input
                  className={inputCls}
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Tajuk sesi"
                />
                <input
                  type="date"
                  className={inputCls}
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={saveEdit}
                    className="rounded-full bg-amber px-5 py-2.5 font-sans text-sm font-semibold uppercase tracking-wider text-ink hover:bg-amber-deep"
                  >
                    Simpan
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditing(false)}
                    className="rounded-full border border-line px-4 py-2.5 font-sans text-sm text-paper hover:border-amber"
                  >
                    Batal
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-2 flex gap-4">
                <button
                  type="button"
                  onClick={startEdit}
                  className="font-sans text-xs font-semibold text-amber hover:text-amber-deep"
                >
                  ✏️ Edit sesi
                </button>
                <button
                  type="button"
                  onClick={deleteSession}
                  className="font-sans text-xs font-semibold text-muted hover:text-amber"
                >
                  🗑️ Padam sesi
                </button>
              </div>
            )}
          </div>

          {/* Senarai ahli + butang status */}
          <div className="flex flex-col gap-2">
            {members.map((m) => {
              const current = statusMap[`${selectedId}:${m.clerk_user_id}`];
              return (
                <div
                  key={m.clerk_user_id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-line bg-bg-soft/50 px-4 py-2.5"
                >
                  <span className="font-sans text-sm text-paper">
                    {m.full_name || "(tanpa nama)"}
                  </span>
                  <div className="flex gap-1.5">
                    {STATUSES.map((s) => (
                      <button
                        key={s.value}
                        type="button"
                        onClick={() => mark(m.clerk_user_id, s.value)}
                        className={`rounded-full px-3 py-1 font-sans text-xs font-semibold transition-colors ${
                          current === s.value
                            ? s.value === "present"
                              ? "bg-amber text-ink"
                              : s.value === "excused"
                                ? "bg-paper/20 text-paper"
                                : "bg-paper/10 text-paper/70"
                            : "border border-line text-muted hover:border-amber hover:text-amber"
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
            {members.length === 0 && (
              <p className="font-sans text-sm text-muted">Belum ada ahli.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
