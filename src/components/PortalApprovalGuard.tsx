"use client";

import { useAuth } from "@clerk/nextjs";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";

// Component to check user approval status and redirect if pending
export function PortalApprovalGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId, isLoaded } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!isLoaded || !userId) {
      setChecking(false);
      return;
    }

    // Allow access to these pages even if pending
    const allowedPages = [
      "/portal/approval-pending",
      "/portal/admin/allowlist",
    ];

    if (allowedPages.some((page) => pathname?.startsWith(page))) {
      setChecking(false);
      return;
    }

    // Check cached status first - hanya cek sekali per session
    const cached = getCachedApprovalStatus();
    if (cached !== null) {
      if (cached === "pending") {
        router.push("/portal/approval-pending");
      }
      setChecking(false);
      return;
    }

    // Jika cache kosong, cek dari API
    checkApprovalStatus();
  }, [isLoaded, userId]); // Removed pathname - hanya cek pada mount/userId change

  const getCachedApprovalStatus = (): string | null => {
    try {
      const cached = sessionStorage.getItem(`approval_status_${userId}`);
      if (cached) {
        const { status, timestamp } = JSON.parse(cached);
        // Cache valid selama 30 menit
        const age = Date.now() - timestamp;
        if (age < 30 * 60 * 1000) {
          return status;
        }
        // Cache expired, delete
        sessionStorage.removeItem(`approval_status_${userId}`);
      }
    } catch (err) {
      console.error("Cache read error:", err);
    }
    return null;
  };

  const cacheApprovalStatus = (status: string) => {
    try {
      sessionStorage.setItem(
        `approval_status_${userId}`,
        JSON.stringify({ status, timestamp: Date.now() })
      );
    } catch (err) {
      console.error("Cache write error:", err);
    }
  };

  const checkApprovalStatus = async () => {
    try {
      const res = await fetch("/api/portal/profile");
      if (res.ok) {
        const data = await res.json();
        const status = data.user?.approval_status || "approved";

        // Cache status untuk session ini
        cacheApprovalStatus(status);

        if (status === "pending") {
          router.push("/portal/approval-pending");
          return;
        }
      }
    } catch (err) {
      console.error("Gagal check approval status:", err);
    } finally {
      setChecking(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-ink flex items-center justify-center">
        <p className="text-paper">Memuatkan…</p>
      </div>
    );
  }

  return <>{children}</>;
}
