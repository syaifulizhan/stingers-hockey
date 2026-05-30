import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

export default async function PortalHome() {
  // Sudah log masuk → terus ke dashboard.
  const { userId } = await auth();
  if (userId) redirect("/portal/dashboard");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <span className="font-sans text-sm font-semibold uppercase tracking-[0.3em] text-amber">
        Portal Ahli
      </span>
      <h1 className="display mt-4 text-6xl leading-none text-paper sm:text-7xl">
        Stingers
        <br />
        <span className="text-amber">Hockey</span>
      </h1>
      <p className="mt-5 max-w-sm font-sans text-base text-muted">
        Ruang khas ahli skuad — lihat task latihan, kehadiran, dan berita
        pasukan.
      </p>

      <div className="mt-9 flex w-full max-w-xs flex-col gap-3">
        <Link
          href="/portal/sign-in"
          className="rounded-full bg-amber px-7 py-3 font-sans text-sm font-semibold uppercase tracking-wider text-ink transition-colors hover:bg-amber-deep"
        >
          Log Masuk
        </Link>
        <Link
          href="/portal/sign-up"
          className="rounded-full border border-line px-7 py-3 font-sans text-sm font-semibold uppercase tracking-wider text-paper transition-colors hover:border-amber hover:text-amber"
        >
          Daftar Akaun
        </Link>
      </div>

      <Link
        href="/"
        className="mt-8 font-sans text-sm text-muted underline-offset-4 hover:text-paper hover:underline"
      >
        ← Kembali ke laman utama
      </Link>
    </main>
  );
}
