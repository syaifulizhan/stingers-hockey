"use client";

import { useState } from "react";
import MemberRow from "./MemberRow";

type Member = {
  clerk_user_id: string;
  full_name: string | null;
  display_name: string | null;
  year: string | null;
  class: string | null;
  role: string;
  banned: boolean;
  is_goalkeeper: boolean;
};

type Filter = "ahli" | "admin" | "ban" | "semua";

export default function MembersPanel({
  members,
  admin,
}: {
  members: Member[];
  admin: boolean;
}) {
  const [filter, setFilter] = useState<Filter>("ahli");

  const counts: Record<Filter, number> = {
    ahli: members.filter((m) => m.role === "member" && !m.banned).length,
    admin: members.filter((m) => m.role === "admin" || m.role === "coach").length,
    ban: members.filter((m) => m.banned).length,
    semua: members.length,
  };

  const match = (m: Member) => {
    switch (filter) {
      case "ahli":
        return m.role === "member" && !m.banned;
      case "admin":
        return m.role === "admin" || m.role === "coach";
      case "ban":
        return m.banned;
      default:
        return true;
    }
  };
  const list = members.filter(match);

  const tabs: { key: Filter; label: string }[] = [
    { key: "ahli", label: "Ahli" },
    { key: "admin", label: "Admin" },
    { key: "ban", label: "Ban" },
    { key: "semua", label: "Keseluruhan" },
  ];

  return (
    <>
      {/* Pil tapisan — klik untuk tapis senarai */}
      <div className="mb-4 flex flex-wrap gap-2">
        {tabs.map((t) => {
          const active = filter === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setFilter(t.key)}
              aria-pressed={active}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-sans text-xs font-semibold transition-colors ${
                active
                  ? "border-amber bg-amber text-ink"
                  : "border-line text-paper hover:border-amber hover:text-amber"
              }`}
            >
              {t.label}
              <span
                className={`rounded-full px-1.5 py-0.5 text-[0.65rem] tabular-nums ${
                  active ? "bg-ink/20 text-ink" : "bg-paper/10 text-paper/70"
                }`}
              >
                {counts[t.key]}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-2">
        {list.map((m) => (
          <MemberRow key={m.clerk_user_id} member={m} viewerIsAdmin={admin} />
        ))}
        {list.length === 0 && (
          <p className="font-sans text-sm text-muted">
            Tiada ahli dalam kategori ini.
          </p>
        )}
      </div>
    </>
  );
}
