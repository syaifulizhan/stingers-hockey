"use client";

import { useEffect } from "react";
import { useAuth, useClerk } from "@clerk/nextjs";

// Auto log keluar selepas 10 minit tiada aktiviti (gerak/taip/sentuh/scroll).
// Hanya aktif bila pengguna sudah log masuk. Setiap peranti bebas — jadi
// log masuk serentak banyak peranti masih ok; yang melahu sahaja log keluar.
const IDLE_MS = 10 * 60 * 1000; // 10 minit

export default function IdleLogout() {
  const { isSignedIn } = useAuth();
  const { signOut } = useClerk();

  useEffect(() => {
    if (!isSignedIn) return;

    let last = Date.now();
    const mark = () => {
      last = Date.now();
    };
    const events = [
      "mousemove",
      "mousedown",
      "keydown",
      "touchstart",
      "scroll",
      "click",
    ];
    events.forEach((e) => window.addEventListener(e, mark, { passive: true }));

    const check = setInterval(() => {
      if (Date.now() - last >= IDLE_MS) {
        signOut({ redirectUrl: "/" });
      }
    }, 30000); // semak setiap 30 saat

    return () => {
      events.forEach((e) => window.removeEventListener(e, mark));
      clearInterval(check);
    };
  }, [isSignedIn, signOut]);

  return null;
}
