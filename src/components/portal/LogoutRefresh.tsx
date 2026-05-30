"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@clerk/nextjs";

// Bila pengguna bertukar daripada log masuk → log keluar (cara apa pun:
// avatar, butang Log Keluar, atau auto-logout melahu), buat muat semula PENUH
// ke laman utama supaya mereka nampak jelas mereka sudah log keluar.
export default function LogoutRefresh() {
  const { isLoaded, isSignedIn } = useAuth();
  const wasSignedIn = useRef(false);

  useEffect(() => {
    if (!isLoaded) return;
    if (isSignedIn) {
      wasSignedIn.current = true;
    } else if (wasSignedIn.current) {
      wasSignedIn.current = false;
      window.location.href = "/"; // muat semula penuh → UI log keluar jelas
    }
  }, [isLoaded, isSignedIn]);

  return null;
}
