"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";

interface AllowlistDomain {
  id: string;
  domain: string;
  created_by: string;
  created_at: string;
}

interface PendingApproval {
  id: string;
  user_id: string;
  domain: string;
  status: string;
  requested_at: string;
  user?: {
    full_name: string;
    email: string;
    school: string;
  };
}

export default function AllowlistPage() {
  const { userId, isLoaded } = useAuth();
  const router = useRouter();
  const [domains, setDomains] = useState<AllowlistDomain[]>([]);
  const [pending, setPending] = useState<PendingApproval[]>([]);
  const [newDomain, setNewDomain] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"domains" | "pending">("pending");

  useEffect(() => {
    if (isLoaded && !userId) {
      router.push("/portal");
      return;
    }

    if (isLoaded && userId) {
      fetchData();
    }
  }, [isLoaded, userId, router]);

  const fetchData = async () => {
    try {
      const [domainsRes, pendingRes] = await Promise.all([
        fetch("/api/portal/admin/allowlist"),
        fetch("/api/portal/admin/pending-approvals"),
      ]);

      if (!domainsRes.ok || !pendingRes.ok) {
        throw new Error("Gagal ambil data");
      }

      const domainsData = await domainsRes.json();
      const pendingData = await pendingRes.json();

      setDomains(domainsData.domains || []);
      setPending(pendingData.pending || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ralat tidak diketahui");
    } finally {
      setLoading(false);
    }
  };

  const handleAddDomain = async () => {
    if (!newDomain.trim()) {
      setError("Domain tidak boleh kosong");
      return;
    }

    try {
      const res = await fetch("/api/portal/admin/allowlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: newDomain.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal tambah domain");
      }

      setNewDomain("");
      setError("");
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ralat");
    }
  };

  const handleRemoveDomain = async (domain: string) => {
    if (!confirm(`Buang domain ${domain}?`)) return;

    try {
      const res = await fetch("/api/portal/admin/allowlist", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain }),
      });

      if (!res.ok) throw new Error("Gagal buang domain");

      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ralat");
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
        <h1 className="display text-4xl text-paper mb-8">Domain Allowlist</h1>

        {error && (
          <div className="mb-6 rounded-lg bg-amber/20 p-4 text-amber border border-amber/50">
            {error}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex gap-4 mb-8 border-b border-line">
          <button
            onClick={() => setActiveTab("pending")}
            className={`px-4 py-3 font-sans font-semibold ${
              activeTab === "pending"
                ? "border-b-2 border-amber text-amber"
                : "text-muted hover:text-paper"
            }`}
          >
            Pending Approval ({pending.length})
          </button>
          <button
            onClick={() => setActiveTab("domains")}
            className={`px-4 py-3 font-sans font-semibold ${
              activeTab === "domains"
                ? "border-b-2 border-amber text-amber"
                : "text-muted hover:text-paper"
            }`}
          >
            Domain ({domains.length})
          </button>
        </div>

        {/* Pending Approvals Tab */}
        {activeTab === "pending" && (
          <div>
            {pending.length === 0 ? (
              <p className="text-muted py-8 text-center">Tiada pending approval</p>
            ) : (
              <div className="space-y-4">
                {pending.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-lg border border-line bg-bg-soft p-4"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-sans font-semibold text-paper">
                          {item.user?.full_name || "N/A"}
                        </h3>
                        <p className="text-sm text-muted">
                          {item.user?.email} • {item.user?.school}
                        </p>
                        <p className="text-xs text-muted mt-1">
                          Domain: {item.domain}
                        </p>
                      </div>
                      <span className="text-xs bg-amber/20 text-amber px-2 py-1 rounded">
                        {item.status}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleApprove(item.id, "approve")}
                        className="text-sm"
                      >
                        Luluskan
                      </Button>
                      <button
                        onClick={() => handleApprove(item.id, "reject")}
                        className="text-sm px-4 py-2 rounded-lg border border-line text-paper hover:bg-bg-soft transition"
                      >
                        Tolak
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Domain Allowlist Tab */}
        {activeTab === "domains" && (
          <div>
            <div className="mb-6 p-4 rounded-lg bg-bg-soft border border-line">
              <label className="block font-sans text-sm font-semibold text-paper mb-2">
                Tambah Domain Baru
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  placeholder="cth: gpi.edu.my"
                  className="flex-1 rounded-lg border border-line bg-ink px-3 py-2 font-sans text-paper placeholder:text-muted/60"
                  onKeyPress={(e) => e.key === "Enter" && handleAddDomain()}
                />
                <Button onClick={handleAddDomain} className="text-sm">
                  Tambah
                </Button>
              </div>
            </div>

            {domains.length === 0 ? (
              <p className="text-muted py-8 text-center">Tiada domain dalam senarai</p>
            ) : (
              <div className="space-y-2">
                {domains.map((domain) => (
                  <div
                    key={domain.id}
                    className="flex justify-between items-center p-3 rounded-lg border border-line bg-bg-soft"
                  >
                    <div>
                      <p className="font-sans font-semibold text-paper">
                        {domain.domain}
                      </p>
                      <p className="text-xs text-muted">
                        Ditambah: {new Date(domain.created_at).toLocaleDateString("ms-MY")}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemoveDomain(domain.domain)}
                      className="text-xs px-3 py-1 rounded text-paper hover:bg-amber/20 hover:text-amber transition"
                    >
                      Buang
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
