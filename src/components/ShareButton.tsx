"use client";

import { useState } from "react";
import { Share2, Link2, Check, X as XIcon } from "lucide-react";
import { useLang } from "@/lib/i18n";

// Ikon brand ringkas (lucide tiada glyph brand).
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.945C.16 5.335 5.495 0 12.05 0a11.82 11.82 0 018.413 3.488 11.82 11.82 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.51 5.26l-.999 3.648 3.978-1.219zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
    </svg>
  );
}
function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}
function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0a12 12 0 00-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  );
}
function XBrandIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.66l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export default function ShareButton({ title }: { title: string }) {
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const url =
    typeof window !== "undefined" ? window.location.href : "https://hoki.my";
  const e = encodeURIComponent;

  const targets = [
    { label: "WhatsApp", Icon: WhatsAppIcon, href: `https://wa.me/?text=${e(`${title} ${url}`)}` },
    { label: "Facebook", Icon: FacebookIcon, href: `https://www.facebook.com/sharer/sharer.php?u=${e(url)}` },
    { label: "Telegram", Icon: TelegramIcon, href: `https://t.me/share/url?url=${e(url)}&text=${e(title)}` },
    { label: "X", Icon: XBrandIcon, href: `https://twitter.com/intent/tweet?url=${e(url)}&text=${e(title)}` },
  ];

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt(t("Salin pautan ini:", "Copy this link:"), url);
    }
  };

  const nativeShare = async () => {
    try {
      await navigator.share?.({ title, url });
      setOpen(false);
    } catch {
      /* dibatalkan */
    }
  };

  const hasNative =
    typeof navigator !== "undefined" && typeof navigator.share === "function";

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => (hasNative ? nativeShare() : setOpen((o) => !o))}
        className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 font-sans text-sm font-semibold text-paper transition-colors hover:border-amber hover:text-amber"
      >
        <Share2 className="h-4 w-4" /> {t("Kongsi", "Share")}
      </button>

      {open && !hasNative && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 z-50 mt-2 w-64 rounded-xl border border-line bg-bg-soft p-4 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <span className="font-sans text-sm font-semibold text-paper">
                {t("Kongsi berita", "Share article")}
              </span>
              <button type="button" onClick={() => setOpen(false)} aria-label="Tutup" className="text-muted hover:text-paper">
                <XIcon className="h-4 w-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={copy}
              className="flex w-full items-center gap-2 rounded-lg border border-line px-3 py-2 font-sans text-sm text-paper transition-colors hover:border-amber"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-amber" /> {t("Pautan disalin!", "Link copied!")}
                </>
              ) : (
                <>
                  <Link2 className="h-4 w-4 text-amber" /> {t("Salin pautan", "Copy link")}
                </>
              )}
            </button>

            <div className="mt-3 flex justify-between">
              {targets.map(({ label, Icon, href }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  onClick={() => setOpen(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-line text-paper/80 transition-colors hover:border-amber hover:text-amber"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
