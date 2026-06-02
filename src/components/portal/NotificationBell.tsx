"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";

type Notif = {
  id: string;
  title: string;
  body: string | null;
  link: string | null;
  created_at: string;
};

export default function NotificationBell() {
  const [items, setItems] = useState<Notif[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  // Kedudukan popup dikira (fixed) supaya sentiasa muat dalam skrin walau loceng
  // berada di kiri atau kanan (bergantung pada susunan nav yang wrap).
  const [coords, setCoords] = useState<{ top: number; left: number; width: number } | null>(null);

  const place = () => {
    const el = btnRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const vw = window.innerWidth;
    const width = Math.min(320, vw - 16); // w-80, atau muat skrin (margin 8px)
    // Jajar tepi kanan popup dengan tepi kanan loceng, kemudian kepit dalam skrin.
    let left = r.right - width;
    left = Math.max(8, Math.min(left, vw - width - 8));
    setCoords({ top: r.bottom + 8, left, width });
  };

  const load = async () => {
    try {
      const res = await fetch("/api/portal/notifications", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setItems(data.items ?? []);
      setUnread(data.unread ?? 0);
    } catch {
      // senyap — loceng tidak kritikal
    }
  };

  useEffect(() => {
    const first = setTimeout(load, 0); // muat awal
    const t = setInterval(load, 30000); // semak setiap 30s
    const onVisible = () => {
      if (document.visibilityState === "visible") load();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", load);
    return () => {
      clearTimeout(first);
      clearInterval(t);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", load);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const markAllRead = async () => {
    if (unread === 0) return;
    setUnread(0);
    try {
      await fetch("/api/portal/notifications", { method: "POST" });
      await load(); // segerak dengan server supaya kiraan tepat
    } catch {
      // abaikan
    }
  };

  const toggle = () => {
    const next = !open;
    if (next) place(); // kira kedudukan sebelum buka
    setOpen(next);
    if (next) markAllRead(); // mark as read bila dibuka
  };

  // Kekal jajar bila skrin diubah saiz / di-scroll semasa popup terbuka.
  useEffect(() => {
    if (!open) return;
    const onMove = () => place();
    window.addEventListener("resize", onMove);
    window.addEventListener("scroll", onMove, true);
    return () => {
      window.removeEventListener("resize", onMove);
      window.removeEventListener("scroll", onMove, true);
    };
  }, [open]);

  return (
    <div className="relative">
      <button
        ref={btnRef}
        type="button"
        onClick={toggle}
        aria-label="Notifikasi"
        className="relative rounded-full p-2 text-paper transition-colors hover:bg-bg-soft"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber px-1 font-sans text-[0.6rem] font-bold text-ink">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && coords && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className="fixed z-50 overflow-hidden rounded-xl border border-line bg-bg-soft shadow-xl"
            style={{ top: coords.top, left: coords.left, width: coords.width }}
          >
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <span className="font-sans text-sm font-semibold text-paper">
                Notifikasi
              </span>
              <button
                type="button"
                onClick={markAllRead}
                className="font-sans text-xs font-semibold text-amber transition-colors hover:text-amber-deep"
              >
                Tandai semua dibaca
              </button>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {items.length === 0 ? (
                <p className="px-4 py-6 text-center font-sans text-sm text-muted">
                  Tiada notifikasi.
                </p>
              ) : (
                items.map((n) => {
                  const inner = (
                    <>
                      <p className="font-sans text-sm font-medium text-paper">{n.title}</p>
                      {n.body && (
                        <p className="mt-0.5 font-sans text-xs text-muted">{n.body}</p>
                      )}
                      <p className="mt-1 font-sans text-[0.65rem] text-muted">
                        {new Date(n.created_at).toLocaleString("ms-MY", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </>
                  );
                  return n.link ? (
                    <Link
                      key={n.id}
                      href={n.link}
                      onClick={() => setOpen(false)}
                      className="block border-b border-line/50 px-4 py-3 transition-colors hover:bg-ink/40"
                    >
                      {inner}
                    </Link>
                  ) : (
                    <div key={n.id} className="border-b border-line/50 px-4 py-3">
                      {inner}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
