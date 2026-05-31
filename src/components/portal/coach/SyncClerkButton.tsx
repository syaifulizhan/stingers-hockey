"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";

// Butang admin: tarik semua pengguna Clerk ke Supabase serta-merta.
export default function SyncClerkButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const sync = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/portal/coach/sync-clerk", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal segerak.");
      setMsg(`✓ Selesai — ${data.total} pengguna disegerak.`);
      router.refresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Gagal segerak.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mb-4 flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={sync}
        disabled={busy}
        className="inline-flex items-center gap-2 rounded-full border border-amber/50 bg-amber/10 px-4 py-1.5 font-sans text-xs font-semibold uppercase tracking-wider text-amber transition-colors hover:bg-amber/20 disabled:opacity-60"
      >
        <RefreshCw className={`h-4 w-4 ${busy ? "animate-spin" : ""}`} />
        {busy ? "Menyegerak…" : "Segerak Pengguna Clerk"}
      </button>
      {msg && <span className="font-sans text-xs text-paper/80">{msg}</span>}
    </div>
  );
}
