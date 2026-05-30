"use client";

import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { contact, navLinks, social } from "@/lib/site";
import Wordmark from "@/components/ui/Wordmark";

// Ikon brand — versi lucide ini tiada glyph brand, jadi guna SVG inline.
function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.66l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
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

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  );
}

export default function Footer() {
  return (
    <footer id="hubungi" className="border-t border-line bg-bg-soft">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr]">
          {/* Kolum 1 — brand */}
          <div>
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element -- logo statik kecil, fallback teks */}
              <img
                src="/images/logo-white.png"
                alt="Logo Stingers Hockey"
                className="h-10 w-10 object-contain"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
              <Wordmark className="text-2xl" />
            </div>
            <p className="mt-5 max-w-sm font-sans text-sm leading-relaxed text-muted">
              Pasukan hoki rasmi Sekolah Kebangsaan Taman Desaminium, diuruskan
              oleh organisasi bebas.{" "}
              <em className="text-paper/80">Kicking goals. Breaking moulds.</em>
            </p>
          </div>

          {/* Kolum 2 — hubungi */}
          <div>
            <h3 className="display text-xl text-paper">Hubungi</h3>
            <ul className="mt-5 flex flex-col gap-4 font-sans text-sm text-muted">
              <li>
                <a
                  href={contact.phoneHref}
                  className="flex items-center gap-3 transition-colors hover:text-amber"
                >
                  <Phone className="h-4 w-4 shrink-0 text-amber" />
                  {contact.phone}
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${contact.email}`}
                  className="flex items-center gap-3 transition-colors hover:text-amber"
                >
                  <Mail className="h-4 w-4 shrink-0 text-amber" />
                  {contact.email}
                </a>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-amber" />
                <span>{contact.address}</span>
              </li>
            </ul>
          </div>

          {/* Kolum 3 — navigasi */}
          <div>
            <h3 className="display text-xl text-paper">Navigasi</h3>
            <ul className="mt-5 flex flex-col gap-3 font-sans text-sm text-muted">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="transition-colors hover:text-amber"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bawah footer */}
        <div className="mt-14 flex flex-col items-center justify-between gap-6 border-t border-line pt-8 sm:flex-row">
          <p className="font-sans text-xs text-muted">
            © 2026 Stingers Hockey. Hak cipta terpelihara.
          </p>
          <div className="flex items-center gap-3">
            {[
              { href: social.facebook, label: "Facebook", Icon: FacebookIcon },
              { href: social.instagram, label: "Instagram", Icon: InstagramIcon },
              { href: social.x, label: "X", Icon: XIcon },
            ].map(({ href, label, Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-paper/70 transition-colors hover:border-amber hover:text-amber"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
