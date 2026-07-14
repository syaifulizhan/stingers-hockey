"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Clock, CheckCircle, XCircle } from "lucide-react";
import Button from "@/components/ui/Button";

interface PendingApproval {
  id: string;
  user_id: string;
  status: string;
  requested_at: string;
  user?: {
    full_name: string;
    email: string;
    school: string;
    profile_complete: boolean;
    created_at: string;
  };
}

export default function ApprovalPage() {
  const { userId, isLoaded } = useAuth();
  const router = useRouter();
  const [pending, setPending] = useState<PendingApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isLoaded && !userId) {
      router.push("/portal");
      return;
    }

    if (isLoaded && userId) {
      fetchData();
      const interval = setInterval(fetchData, 3000);
      return () => clearInterval(interval);
    }
  }, [isLoaded, userId, router]);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/portal/admin/pending-approvals");

      if (!res.ok) {
        throw new Error("Gagal ambil data");
      }

      const data = await res.json();
      setPending(data.pending || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ralat tidak diketahui");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (approvalId: string, action: "approve" | "reject") => {
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

      if (!res.ok) throw new Error("Gagal kemaskini approval");

      setError("");
      await new Promise(r => setTimeout(r, 500));
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ralat");
    }
  };

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-ink px-6 py-12 text-center">
        <p className="text-paper">Memuatkan…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink px-6 py-12">
      <div className="mx-auto max-w-4xl">
        <h1 className="display text-4xl text-paper mb-2">Kelulusan Pendaftaran</h1>
        <p className="text-muted mb-8 font-sans text-sm">
          Luluskan atau tolak cubaan sign up baharu
        </p>

        {error && (
          <div className="mb-6 rounded-lg bg-amber/20 p-4 text-amber border border-amber/50">
            {error}
          </div>
        )}

        {pending.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <p className="text-paper font-sans font-semibold">Tiada pending approval</p>
            <p className="text-muted font-sans text-sm">
              Semua pendaftaran sudah diluluskan
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {pending.map((item) => (
              <div
                key={item.id}
                className="rounded-lg border border-line bg-bg-soft p-5 hover:border-amber/50 transition"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="font-sans font-semibold text-paper text-lg">
                      {item.user?.full_name || "N/A"}
                    </h3>
                    <div className="mt-2 space-y-1 text-sm">
                      <p className="text-muted">
                        📧 <span className="text-paper">{item.user?.email}</span>
                      </p>
                      <p className="text-muted">
                        🏫 <span className="text-paper">{item.user?.school}</span>
                      </p>
                      <p className="text-xs text-muted/70">
                        ⏰ {new Date(item.requested_at).toLocaleDateString("ms-MY", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleApprove(item.id, "approve")}
                      className="px-4 py-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition font-sans text-sm font-semibold flex items-center gap-2"
                    >
                      <CheckCircle className="h-4 w-4" /> Luluskan
                    </button>
                    <button
                      onClick={() => handleApprove(item.id, "reject")}
                      className="px-4 py-2 rounded-lg border border-red-500/50 text-red-400 hover:bg-red-500/10 transition font-sans text-sm font-semibold flex items-center gap-2"
                    >
                      <XCircle className="h-4 w-4" /> Tolak
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
