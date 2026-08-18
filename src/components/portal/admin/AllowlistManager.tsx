"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle, XCircle, Trash2, Plus, ShieldCheck, Clock } from "lucide-react";

type PendingApproval = {
  id: string;
  user_id: string;
  status: string;
  requested_at: string;
  user?: {
    full_name: string | null;
    email: string | null;
    school: string | null;
    profile_complete: boolean;
    created_at: string;
  } | null;
};

type AllowedEmail = {
  email: string;
  note: string | null;
  created_at: string;
};

export default function AllowlistManager() {
  const [pending, setPending] = useState<PendingApproval[]>([]);
  const [emails, setEmails] = useState<AllowedEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [newEmail, setNewEmail] = useState("");

  const load = useCallback(async () => {
    try {
      const [pRes, eRes] = await Promise.all([
        fetch("/api/portal/admin/pending-approvals"),
        fetch("/api/portal/admin/allowlist"),
      ]);
      if (!pRes.ok) throw new Error("Gagal ambil senarai menunggu kelulusan");
      const pData = await pRes.json();
      setPending(pData.pending ?? []);

      // Allowlist emel bergantung pada migrasi SQL. Jika ia belum dijalankan,
      // tunjukkan amaran tanpa merosakkan panel kelulusan.
      if (eRes.ok) {
        const eData = await eRes.json();
        setEmails(eData.emails ?? []);
        setError("");
      } else {
        setEmails([]);
        setError(
          "Jadual allowlist_emails belum wujud — jalankan supabase/migrations/20260819_allowlist_enforcement.sql di Supabase SQL Editor."
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ralat tidak diketahui");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Muat pertama diserahkan kepada task berasingan supaya effect ini tidak
    // memanggil setState secara segerak (react-hooks/set-state-in-effect).
    const first = setTimeout(load, 0);
    const poll = setInterval(load, 15000);
    return () => {
      clearTimeout(first);
      clearInterval(poll);
    };
  }, [load]);

  const decide = useCallback(
    async (approvalId: string, action: "approve" | "reject") => {
      setBusy(approvalId);
      try {
        const res = await fetch("/api/portal/admin/pending-approvals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            approvalId,
            action,
            note: action === "reject" ? "Ditolak oleh admin" : null,
          }),
        });
        if (!res.ok) throw new Error("Gagal kemas kini kelulusan");
        await load();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Ralat");
      } finally {
        setBusy(null);
      }
    },
    [load]
  );

  const addEmail = useCallback(async () => {
    if (!newEmail.trim()) return;
    setBusy("add-email");
    try {
      const res = await fetch("/api/portal/admin/allowlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newEmail }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Gagal tambah emel");
      setNewEmail("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ralat");
    } finally {
      setBusy(null);
    }
  }, [newEmail, load]);

  const removeEmail = useCallback(
    async (email: string) => {
      setBusy(email);
      try {
        const res = await fetch("/api/portal/admin/allowlist", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        if (!res.ok) throw new Error("Gagal buang emel");
        await load();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Ralat");
      } finally {
        setBusy(null);
      }
    },
    [load]
  );

  if (loading) {
    return <p className="text-paper font-sans">Memuatkan…</p>;
  }

  return (
    <div className="space-y-12">
      {error && (
        <div className="rounded-lg border border-amber/50 bg-amber/10 p-4 font-sans text-sm text-amber">
          {error}
        </div>
      )}

      {/* ── Bahagian 1: emel yang dibenarkan (pra-kelulusan) ─────────────── */}
      <section>
        <h2 className="flex items-center gap-2 font-sans text-lg font-semibold text-paper">
          <ShieldCheck className="h-5 w-5 text-amber" /> Emel Dibenarkan
        </h2>
        <p className="mt-1 font-sans text-sm text-muted">
          Sesiapa dalam senarai ini diluluskan automatik sebaik mereka log
          masuk. Semua orang lain tersekat sehingga anda luluskan di bawah.
        </p>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") addEmail();
            }}
            placeholder="nama@sekolah.edu.my (boleh berbilang, pisah dengan koma)"
            className="flex-1 rounded-lg border border-line bg-ink px-4 py-2.5 font-sans text-sm text-paper placeholder:text-muted/60 focus:border-amber focus:outline-none"
          />
          <button
            onClick={addEmail}
            disabled={busy === "add-email" || !newEmail.trim()}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber px-5 py-2.5 font-sans text-sm font-semibold text-ink transition hover:bg-amber-deep disabled:opacity-40"
          >
            <Plus className="h-4 w-4" /> Tambah
          </button>
        </div>

        {emails.length === 0 ? (
          <p className="mt-4 font-sans text-sm text-muted">
            Belum ada emel dalam allowlist.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-line rounded-lg border border-line">
            {emails.map((e) => (
              <li
                key={e.email}
                className="flex items-center justify-between gap-4 px-4 py-3"
              >
                <span className="font-sans text-sm text-paper">{e.email}</span>
                <button
                  onClick={() => removeEmail(e.email)}
                  disabled={busy === e.email}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/40 px-3 py-1.5 font-sans text-xs font-semibold text-red-400 transition hover:bg-red-500/10 disabled:opacity-40"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Buang
                </button>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 font-sans text-xs text-muted/70">
          {emails.length} emel dalam allowlist app (selain env
          PORTAL_ALLOWED_EMAILS). Membuang emel di sini tidak menarik balik
          kelulusan sedia ada — gunakan &ldquo;Tolak&rdquo; untuk itu.
        </p>
      </section>

      {/* ── Bahagian 2: menunggu kelulusan ───────────────────────────────── */}
      <section>
        <h2 className="flex items-center gap-2 font-sans text-lg font-semibold text-paper">
          <Clock className="h-5 w-5 text-amber" /> Menunggu Kelulusan
          {pending.length > 0 && (
            <span className="rounded-full bg-amber px-2 py-0.5 font-sans text-xs font-bold text-ink">
              {pending.length}
            </span>
          )}
        </h2>

        {pending.length === 0 ? (
          <div className="mt-6 rounded-lg border border-line py-10 text-center">
            <CheckCircle className="mx-auto mb-3 h-10 w-10 text-green-500" />
            <p className="font-sans font-semibold text-paper">
              Tiada pendaftaran menunggu
            </p>
            <p className="font-sans text-sm text-muted">
              Setiap sign up baharu akan muncul di sini.
            </p>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {pending.map((item) => (
              <div
                key={item.id}
                className="rounded-lg border border-line bg-bg-soft p-5 transition hover:border-amber/50"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1">
                    <h3 className="font-sans text-lg font-semibold text-paper">
                      {item.user?.full_name || "(tiada nama)"}
                    </h3>
                    <div className="mt-2 space-y-1 text-sm">
                      <p className="text-muted">
                        📧 <span className="text-paper">{item.user?.email || "—"}</span>
                      </p>
                      <p className="text-muted">
                        🏫 <span className="text-paper">{item.user?.school || "—"}</span>
                      </p>
                      {!item.user?.profile_complete && (
                        <p className="text-xs text-amber">
                          ⚠️ Profil belum lengkap
                        </p>
                      )}
                      <p className="text-xs text-muted/70">
                        ⏰{" "}
                        {new Date(item.requested_at).toLocaleDateString("ms-MY", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex w-full gap-2 sm:w-auto">
                    <button
                      onClick={() => decide(item.id, "approve")}
                      disabled={busy === item.id}
                      className="flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-green-500/20 px-4 py-2 font-sans text-sm font-semibold text-green-400 transition hover:bg-green-500/30 disabled:opacity-40 sm:flex-none"
                    >
                      <CheckCircle className="h-4 w-4" /> Luluskan
                    </button>
                    <button
                      onClick={() => decide(item.id, "reject")}
                      disabled={busy === item.id}
                      className="flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-red-500/50 px-4 py-2 font-sans text-sm font-semibold text-red-400 transition hover:bg-red-500/10 disabled:opacity-40 sm:flex-none"
                    >
                      <XCircle className="h-4 w-4" /> Tolak
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
