"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Clock, AlertCircle } from "lucide-react";

export default function ApprovalPendingPage() {
  const { userId, isLoaded } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const [approvalInfo, setApprovalInfo] = useState<{
    status: string;
    requested_at: string;
    domain: string;
  } | null>(null);

  useEffect(() => {
    if (isLoaded && !userId) {
      router.push("/portal");
      return;
    }

    if (isLoaded && userId) {
      fetchApprovalStatus();
      const interval = setInterval(fetchApprovalStatus, 2000);
      return () => clearInterval(interval);
    }
  }, [isLoaded, userId, router]);

  const fetchApprovalStatus = async () => {
    try {
      const res = await fetch("/api/portal/profile");
      if (res.ok) {
        const data = await res.json();
        if (data.user?.approval_status === "approved") {
          router.push("/portal");
          return;
        }
        if (data.user?.approval_status === "rejected") {
          setApprovalInfo({
            status: "rejected",
            requested_at: data.user?.created_at,
            domain: data.user?.email?.split("@")[1] || "unknown",
          });
          return;
        }
        setApprovalInfo({
          status: data.user?.approval_status || "pending",
          requested_at: data.user?.created_at,
          domain: data.user?.email?.split("@")[1] || "unknown",
        });
      }
    } catch (err) {
      console.error("Gagal ambil status approval:", err);
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-ink flex items-center justify-center">
        <p className="text-paper">Memuatkan…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink flex items-center justify-center px-6 py-12">
      <div className="mx-auto max-w-md text-center">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-amber/20 mb-6">
          <Clock className="h-8 w-8 text-amber" />
        </div>

        <h1 className="display text-3xl text-paper mb-3">
          Tunggu Kelulusan
        </h1>

        <p className="font-sans text-base text-muted mb-6">
          Pendaftaran anda dari domain <strong>{approvalInfo?.domain}</strong> sedang
          menunggu kelulusan daripada admin atau jurulatih.
        </p>

        <div className="bg-bg-soft border border-line rounded-lg p-4 mb-6 text-left">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber shrink-0 mt-0.5" />
            <div className="font-sans text-sm">
              <p className="text-paper font-semibold mb-1">Maklumat Anda</p>
              <p className="text-muted">
                Nama: <span className="text-paper">{user?.firstName}</span>
              </p>
              <p className="text-muted">
                Email: <span className="text-paper">{user?.primaryEmailAddress?.emailAddress}</span>
              </p>
              {approvalInfo?.requested_at && (
                <p className="text-muted mt-2">
                  Diminta pada:{" "}
                  <span className="text-paper">
                    {new Date(approvalInfo.requested_at).toLocaleDateString(
                      "ms-MY",
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    )}
                  </span>
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <p className="font-sans text-sm text-muted">
            Kami akan memberi notifikasi sebaik sahaja kelulusan diberikan.
          </p>
          <button
            onClick={() => router.push("/portal")}
            className="w-full px-4 py-3 rounded-lg bg-amber text-ink font-sans font-semibold hover:bg-amber-deep transition"
          >
            Kembali ke Portal
          </button>
        </div>
      </div>
    </div>
  );
}
