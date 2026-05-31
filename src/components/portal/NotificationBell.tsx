"use client";

import { useEffect, useState } from "react";
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

  useEffect(() => {
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
    const first = setTimeout(load, 0); // muat awal (bukan segerak dalam effect)
    const t = setInterval(load, 60000); // semak setiap 60s
    return () => {
      clearTimeout(first);
      clearInterval(t);
    };
  }, []);

  const markAllRead = async () => {
    if (unread === 0) return;
    setUnread(0);
    try {
      await fetch("/api/portal/notifications", { method: "POST" });
    } catch {
      // abaikan
    }
  };

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next) markAllRead(); // mark as read bila dibuka
  };

  return (
    <div className="relative">
      <button
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

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-80 max-w-[85vw] overflow-hidden rounded-xl border border-line bg-bg-soft shadow-xl">
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
