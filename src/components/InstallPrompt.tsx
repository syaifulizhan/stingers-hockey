"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Download, Share, Plus, X } from "lucide-react";

// Acara beforeinstallprompt (Chrome/Edge/Android) — bukan dalam lib TS standard.
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIos() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const iOSDevice = /iphone|ipad|ipod/i.test(ua);
  // iPadOS 13+ menyamar sebagai Mac — kesan melalui skrin sentuh.
  const iPadOS = /macintosh/i.test(ua) && navigator.maxTouchPoints > 1;
  return iOSDevice || iPadOS;
}

export default function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);
  const [iosSheet, setIosSheet] = useState(false);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    if (isStandalone()) return; // sudah dipasang — jangan tunjuk
    if (sessionStorage.getItem("installDismissed")) return;

    // Android/desktop Chrome: tangkap acara, tunjuk butang.
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setShow(true);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);

    // Sembunyi selepas dipasang.
    const onInstalled = () => setShow(false);
    window.addEventListener("appinstalled", onInstalled);

    // Kesan iOS (tiada beforeinstallprompt — tunjuk butang arahan terus).
    const detect = () => {
      const iosDevice = isIos();
      setIos(iosDevice);
      if (iosDevice) setShow(true);
    };
    detect();

    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const dismiss = () => {
    setShow(false);
    setIosSheet(false);
    sessionStorage.setItem("installDismissed", "1");
  };

  const onClick = async () => {
    if (ios) {
      setIosSheet(true);
      return;
    }
    if (!deferred) return;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    if (outcome === "accepted") setShow(false);
    setDeferred(null);
  };

  if (!show) return null;

  return (
    <>
      <AnimatePresence>
        {!iosSheet && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:inset-x-auto sm:right-6 sm:justify-end"
          >
            <div className="flex items-center gap-2 rounded-full border border-amber/40 bg-bg-soft/95 p-1.5 pl-4 shadow-lg backdrop-blur-md">
              <span className="font-sans text-sm font-medium text-paper/90">
                Pasang app Stingers
              </span>
              <button
                type="button"
                onClick={onClick}
                className="inline-flex items-center gap-1.5 rounded-full bg-amber px-4 py-2 font-sans text-sm font-semibold uppercase tracking-wider text-ink transition-colors hover:bg-amber-deep"
              >
                <Download className="h-4 w-4" />
                Pasang
              </button>
              <button
                type="button"
                onClick={dismiss}
                aria-label="Tutup"
                className="rounded-full p-1.5 text-muted transition-colors hover:text-paper"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Arahan iOS (Safari tiada prompt automatik) */}
      <AnimatePresence>
        {iosSheet && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIosSheet(false)}
              className="fixed inset-0 z-40 bg-black/60"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 34 }}
              className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl border-t border-line bg-bg-soft p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))]"
            >
              <div className="mx-auto max-w-sm">
                <div className="mb-5 flex items-center justify-between">
                  <h3 className="display text-2xl text-paper">Pasang ke iPhone</h3>
                  <button
                    type="button"
                    onClick={() => setIosSheet(false)}
                    aria-label="Tutup"
                    className="text-muted hover:text-paper"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
                <ol className="flex flex-col gap-4 font-sans text-sm text-paper/90">
                  <li className="flex items-center gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber font-semibold text-ink">
                      1
                    </span>
                    <span className="flex items-center gap-1.5">
                      Tekan butang{" "}
                      <Share className="inline h-4 w-4 text-amber" /> (Kongsi) di
                      bar Safari.
                    </span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber font-semibold text-ink">
                      2
                    </span>
                    <span className="flex items-center gap-1.5">
                      Pilih{" "}
                      <span className="inline-flex items-center gap-1 font-medium">
                        “Add to Home Screen” <Plus className="inline h-4 w-4 text-amber" />
                      </span>
                    </span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber font-semibold text-ink">
                      3
                    </span>
                    <span>Tekan “Add” — siap! Ikon Stingers muncul di skrin utama.</span>
                  </li>
                </ol>
                <p className="mt-5 text-center font-sans text-xs text-muted">
                  Nota: guna pelayar <strong className="text-paper/80">Safari</strong> (bukan
                  Chrome) untuk pasang di iPhone.
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
