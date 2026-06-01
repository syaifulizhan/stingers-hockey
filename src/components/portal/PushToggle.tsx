"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff, Check } from "lucide-react";

const VAPID = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export default function PushToggle() {
  const [supported, setSupported] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

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
        .then((sub) => setEnabled(!!sub))
        .catch(() => {});
    }
  }, []);

  if (!supported) return null;

  const enable = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setMsg("Kebenaran notifikasi ditolak.");
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
      setEnabled(true);
      setMsg("Notifikasi dihidupkan.");
    } catch {
      setMsg("Gagal hidupkan notifikasi. Cuba lagi.");
    } finally {
      setBusy(false);
    }
  };

  const disable = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch(`/api/portal/push?endpoint=${encodeURIComponent(sub.endpoint)}`, {
          method: "DELETE",
        });
        await sub.unsubscribe();
      }
      setEnabled(false);
      setMsg("Notifikasi dimatikan.");
    } catch {
      setMsg("Gagal matikan.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-bg-soft/50 px-5 py-4">
      <span className="flex items-center gap-2 font-sans text-sm text-paper">
        {enabled ? <Check className="h-4 w-4 text-amber" /> : <Bell className="h-4 w-4 text-amber" />}
        {enabled ? "Notifikasi push dihidupkan" : "Dapat notifikasi di telefon"}
      </span>
      {enabled ? (
        <button
          type="button"
          onClick={disable}
          disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-full border border-line px-4 py-1.5 font-sans text-xs font-semibold text-paper transition-colors hover:border-amber hover:text-amber disabled:opacity-60"
        >
          <BellOff className="h-3.5 w-3.5" /> Matikan
        </button>
      ) : (
        <button
          type="button"
          onClick={enable}
          disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-full bg-amber px-4 py-1.5 font-sans text-xs font-semibold uppercase tracking-wider text-ink transition-colors hover:bg-amber-deep disabled:opacity-60"
        >
          <Bell className="h-3.5 w-3.5" /> {busy ? "…" : "Hidupkan"}
        </button>
      )}
      {msg && <span className="font-sans text-xs text-muted">{msg}</span>}
    </div>
  );
}
