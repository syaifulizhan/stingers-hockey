"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Bell, Check } from "lucide-react";

const VAPID = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

type View = "prompt" | "flash" | "hidden";

export default function PushToggle() {
  const [supported, setSupported] = useState(false);
  const [view, setView] = useState<View>("prompt");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const ok =
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window &&
      !!VAPID;
    setSupported(ok);
    if (ok) {
      navigator.serviceWorker.ready
        .then((reg) => reg.pushManager.getSubscription())
        .then((sub) => {
          if (sub) setView("hidden"); // sudah dihidupkan → sembunyi terus
        })
        .catch(() => {});
    }
  }, []);

  const enable = async () => {
    setBusy(true);
    setErr(null);
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setErr("Kebenaran ditolak. Benarkan dalam tetapan pelayar.");
        setBusy(false);
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID!) as BufferSource,
      });
      const json = sub.toJSON() as { endpoint?: string; keys?: { p256dh: string; auth: string } };
      const res = await fetch("/api/portal/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys }),
      });
      if (!res.ok) throw new Error();
      setBusy(false);
      setView("flash"); // papar "Berjaya" lalu lenyap
    } catch {
      setErr("Gagal hidupkan. Cuba lagi.");
      setBusy(false);
    }
  };

  if (!supported || view === "hidden") return null;

  if (view === "flash") {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 1, 0] }}
        transition={{ duration: 2.6, times: [0, 0.12, 0.75, 1] }}
        onAnimationComplete={() => setView("hidden")}
        className="flex items-center gap-2 font-sans text-sm font-semibold text-amber"
      >
        <Check className="h-4 w-4" /> Berjaya dihidupkan
      </motion.div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-bg-soft/50 px-5 py-4">
      <span className="flex items-center gap-2 font-sans text-sm text-paper">
        <Bell className="h-4 w-4 text-amber" /> Dapatkan notifikasi di telefon
      </span>
      <button
        type="button"
        onClick={enable}
        disabled={busy}
        className="rounded-full bg-amber px-5 py-1.5 font-sans text-xs font-semibold uppercase tracking-wider text-ink transition-colors hover:bg-amber-deep disabled:opacity-60"
      >
        {busy ? "Sedang hidupkan…" : "Hidupkan Notifikasi"}
      </button>
      {err && <span className="font-sans text-xs text-muted">{err}</span>}
    </div>
  );
}
