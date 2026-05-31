"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MoreVertical, Check, X } from "lucide-react";
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

function MenuItem({
  onClick,
  danger,
  children,
}: {
  onClick: () => void;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-lg px-3 py-2 text-left font-sans text-sm transition-colors ${
        danger
          ? "text-red-400 hover:bg-red-500/10"
          : "text-paper hover:bg-amber/10 hover:text-amber"
      }`}
    >
      {children}
    </button>
  );
}

export default function MemberRow({
  member,
  viewerIsAdmin,
}: {
  member: Member;
  viewerIsAdmin: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameVal, setNameVal] = useState(member.display_name ?? "");

  const close = () => setMenuOpen(false);

  const setRole = async (role: "member" | "coach") => {
    close();
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
    close();
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

  const del = async () => {
    close();
    const who = memberName(member.full_name, member.display_name);
    if (
      !window.confirm(
        `Padam ${who} secara KEKAL?\n\nAkaun & semua rekod (kehadiran, hantaran, penilaian) akan dibuang. Tindakan ini TIDAK boleh diundur.`
      )
    )
      return;
    setBusy(true);
    try {
      const res = await fetch(
        `/api/portal/coach/member?id=${encodeURIComponent(member.clerk_user_id)}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error();
    } catch {
      setBusy(false);
      window.alert("Gagal padam ahli.");
      return;
    }
    router.refresh();
  };

  const roleBadge =
    member.role === "admin"
      ? "bg-amber text-ink"
      : member.role === "coach"
        ? "bg-amber/20 text-amber"
        : "border border-line text-muted";

  const isPlayer = member.role === "member";
  const canManage = viewerIsAdmin && member.role !== "admin";

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
            <p className="truncate font-sans text-sm font-medium text-paper">
              {memberName(member.full_name, member.display_name)}
            </p>
            <p className="font-sans text-xs text-muted">
              Tahun {member.year || "-"} · {member.class || "-"}
            </p>
          </>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2">
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

        {canManage && (
          <div className="relative">
            <button
              type="button"
              disabled={busy}
              onClick={() => setMenuOpen((o) => !o)}
              aria-label="Tindakan"
              className="rounded-full border border-line p-1.5 text-muted transition-colors hover:border-amber hover:text-amber disabled:opacity-50"
            >
              <MoreVertical className="h-4 w-4" />
            </button>

            {menuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={close} />
                <div className="absolute right-0 z-50 mt-2 w-52 rounded-xl border border-line bg-bg-soft p-1.5 shadow-xl">
                  <MenuItem
                    onClick={() => {
                      close();
                      setEditingName(true);
                    }}
                  >
                    ✏️ Edit nama
                  </MenuItem>
                  {isPlayer && !member.banned && (
                    <MenuItem onClick={() => patchMember({ isGoalkeeper: !member.is_goalkeeper })}>
                      {member.is_goalkeeper ? "🧤 Buang penanda GK" : "🧤 Tanda GK"}
                    </MenuItem>
                  )}
                  {!member.banned && (
                    <MenuItem
                      onClick={() => setRole(member.role === "coach" ? "member" : "coach")}
                    >
                      {member.role === "coach" ? "Turunkan jadi Ahli" : "Jadikan Coach"}
                    </MenuItem>
                  )}
                  <MenuItem onClick={() => setBanned(!member.banned)} danger={!member.banned}>
                    {member.banned ? "Authorize (nyahban)" : "Ban"}
                  </MenuItem>
                  <MenuItem onClick={del} danger>
                    Padam kekal
                  </MenuItem>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
