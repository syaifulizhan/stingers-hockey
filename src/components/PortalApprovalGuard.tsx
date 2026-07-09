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

    checkApprovalStatus();
  }, [isLoaded, userId, pathname]);

  const checkApprovalStatus = async () => {
    try {
      const res = await fetch("/api/portal/profile");
      if (res.ok) {
        const data = await res.json();
        if (data.user?.approval_status === "pending") {
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
        <p className="text-paper">Memeriksa status kelulusan…</p>
      </div>
    );
  }

  return <>{children}</>;
}
