"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Check, X } from "lucide-react";
import { memberName } from "@/lib/names";

type Member = {
  clerk_user_id: string;
  full_name: string | null;
  display_name?: string | null;
  year: string | null;
  class: string | null;
  role: string;
  banned?: boolean;
  is_goalkeeper?: boolean;
};

export default function MemberRow({
  member,
  viewerIsAdmin,
}: {
  member: Member;
  viewerIsAdmin: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameVal, setNameVal] = useState(member.display_name ?? "");

  const setRole = async (role: "member" | "coach") => {
    setBusy(true);
    try {
      const res = await fetch("/api/portal/coach/role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetClerkId: member.clerk_user_id, role }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setBusy(false);
      return;
    }
    setBusy(false);
    router.refresh();
  };

  const patchMember = async (payload: { displayName?: string; isGoalkeeper?: boolean }) => {
    setBusy(true);
    try {
      const res = await fetch("/api/portal/coach/member", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetClerkId: member.clerk_user_id, ...payload }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setBusy(false);
      window.alert("Gagal kemas kini.");
      return;
    }
    setBusy(false);
    setEditingName(false);
    router.refresh();
  };

  const setBanned = async (banned: boolean) => {
    const who = memberName(member.full_name, member.display_name);
    if (banned && !window.confirm(`Ban ${who}? Mereka akan dihalang log masuk dan hantaran/media mereka dipadam.`)) return;
    setBusy(true);
    try {
      const res = await fetch("/api/portal/coach/ban", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetClerkId: member.clerk_user_id, banned }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setBusy(false);
      window.alert("Gagal kemas kini status ban.");
      return;
    }
    setBusy(false);
    router.refresh();
  };

  const roleBadge =
    member.role === "admin"
      ? "bg-amber text-ink"
      : member.role === "coach"
        ? "bg-amber/20 text-amber"
        : "border border-line text-muted";

  const isPlayer = member.role === "member";

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-line bg-bg-soft/50 px-4 py-3">
      <div className="min-w-0 flex-1">
        {editingName ? (
          <div className="flex items-center gap-2">
            <input
              value={nameVal}
              onChange={(e) => setNameVal(e.target.value)}
              placeholder="Nama sebenar pemain"
              className="w-full rounded-lg border border-line bg-ink px-3 py-1.5 font-sans text-sm text-paper outline-none focus:border-amber"
            />
            <button
              type="button"
              disabled={busy}
              onClick={() => patchMember({ displayName: nameVal })}
              aria-label="Simpan nama"
              className="rounded-md p-1.5 text-amber hover:bg-amber/10"
            >
              <Check className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                setEditingName(false);
                setNameVal(member.display_name ?? "");
              }}
              aria-label="Batal"
              className="rounded-md p-1.5 text-muted hover:bg-paper/10"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <>
            <p className="flex items-center gap-1.5 font-sans text-sm font-medium text-paper">
              {memberName(member.full_name, member.display_name)}
              {viewerIsAdmin && (
                <button
                  type="button"
                  onClick={() => setEditingName(true)}
                  aria-label="Edit nama"
                  className="text-muted transition-colors hover:text-amber"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              )}
            </p>
            <p className="font-sans text-xs text-muted">
              Tahun {member.year || "-"} · {member.class || "-"}
            </p>
          </>
        )}
      </div>

      <div className="flex items-center gap-2">
        {member.is_goalkeeper && (
          <span className="rounded-full bg-amber/20 px-2 py-1 font-sans text-xs font-semibold uppercase text-amber" title="Penjaga Gol">
            🧤 GK
          </span>
        )}
        {member.banned && (
          <span className="rounded-full bg-red-500/20 px-2.5 py-1 font-sans text-xs font-semibold uppercase text-red-400">
            Diban
          </span>
        )}
        <span className={`rounded-full px-2.5 py-1 font-sans text-xs font-semibold uppercase ${roleBadge}`}>
          {member.role}
        </span>
        {/* Admin sahaja boleh ubah; tak boleh ubah admin lain */}
        {viewerIsAdmin && member.role !== "admin" && (
          <>
            {isPlayer && !member.banned && (
              <button
                type="button"
                disabled={busy}
                onClick={() => patchMember({ isGoalkeeper: !member.is_goalkeeper })}
                className={`rounded-full border px-3 py-1 font-sans text-xs font-semibold transition-colors disabled:opacity-50 ${
                  member.is_goalkeeper
                    ? "border-amber bg-amber/10 text-amber"
                    : "border-line text-paper hover:border-amber hover:text-amber"
                }`}
              >
                {member.is_goalkeeper ? "GK ✓" : "Tanda GK"}
              </button>
            )}
            {!member.banned && (
              <button
                type="button"
                disabled={busy}
                onClick={() => setRole(member.role === "coach" ? "member" : "coach")}
                className="rounded-full border border-line px-3 py-1 font-sans text-xs font-semibold text-paper transition-colors hover:border-amber hover:text-amber disabled:opacity-50"
              >
                {busy ? "…" : member.role === "coach" ? "Turunkan" : "Jadikan Coach"}
              </button>
            )}
            <button
              type="button"
              disabled={busy}
              onClick={() => setBanned(!member.banned)}
              className={`rounded-full border px-3 py-1 font-sans text-xs font-semibold transition-colors disabled:opacity-50 ${
                member.banned
                  ? "border-amber text-amber hover:bg-amber hover:text-ink"
                  : "border-red-500/40 text-red-400 hover:bg-red-500 hover:text-paper"
              }`}
            >
              {busy ? "…" : member.banned ? "Authorize" : "Ban"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
