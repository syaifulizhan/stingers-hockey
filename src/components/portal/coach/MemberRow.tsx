"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Member = {
  clerk_user_id: string;
  full_name: string | null;
  year: string | null;
  class: string | null;
  role: string;
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

  const roleBadge =
    member.role === "admin"
      ? "bg-amber text-ink"
      : member.role === "coach"
        ? "bg-amber/20 text-amber"
        : "border border-line text-muted";

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-line bg-bg-soft/50 px-4 py-3">
      <div>
        <p className="font-sans text-sm font-medium text-paper">
          {member.full_name || "(tanpa nama)"}
        </p>
        <p className="font-sans text-xs text-muted">
          Tahun {member.year || "-"} · {member.class || "-"}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <span className={`rounded-full px-2.5 py-1 font-sans text-xs font-semibold uppercase ${roleBadge}`}>
          {member.role}
        </span>
        {/* Admin sahaja boleh ubah; tak boleh ubah admin lain */}
        {viewerIsAdmin && member.role !== "admin" && (
          <button
            type="button"
            disabled={busy}
            onClick={() => setRole(member.role === "coach" ? "member" : "coach")}
            className="rounded-full border border-line px-3 py-1 font-sans text-xs font-semibold text-paper transition-colors hover:border-amber hover:text-amber disabled:opacity-50"
          >
            {busy ? "…" : member.role === "coach" ? "Turunkan" : "Jadikan Coach"}
          </button>
        )}
      </div>
    </div>
  );
}
