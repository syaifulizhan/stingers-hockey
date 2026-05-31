"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutDashboard, UserCog } from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import NotificationBell from "@/components/portal/NotificationBell";
import Wordmark from "@/components/ui/Wordmark";

// Bar navigasi portal — dikongsi oleh dashboard ahli & panel jurulatih.
//   • Laman Utama → website awam (/)
//   • Dashboard   → /portal/dashboard
//   • Edit Profil → /portal/onboarding
const links = [
  { href: "/", label: "Laman Utama", Icon: Home },
  { href: "/portal/dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/portal/onboarding", label: "Edit Profil", Icon: UserCog },
];

export default function PortalNav({ badge }: { badge?: string }) {
  const pathname = usePathname();

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-5">
      <div className="flex items-center gap-3">
        <Link href="/" aria-label="Laman utama Stingers Hockey">
          <Wordmark className="text-xl" />
        </Link>
        {badge && (
          <span className="rounded-full bg-amber/20 px-2.5 py-1 font-sans text-xs font-semibold uppercase text-amber">
            {badge}
          </span>
        )}
      </div>

      <nav className="flex items-center gap-1.5">
        {links.map(({ href, label, Icon }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              title={label}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-sans text-xs font-semibold transition-colors ${
                active
                  ? "border-amber bg-amber/10 text-amber"
                  : "border-line text-paper hover:border-amber hover:text-amber"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{label}</span>
            </Link>
          );
        })}
        <NotificationBell />
        <UserButton />
      </nav>
    </header>
  );
}
