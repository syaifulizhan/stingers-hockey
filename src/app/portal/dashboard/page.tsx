import { currentUser } from "@clerk/nextjs/server";
import { UserButton } from "@clerk/nextjs";

export default async function DashboardPage() {
  const user = await currentUser();
  const name = user?.firstName || user?.username || "Ahli";

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <header className="flex items-center justify-between border-b border-line pb-5">
        <span className="display text-2xl text-paper">
          Stingers<span className="text-amber">.</span>
        </span>
        <UserButton />
      </header>

      <h1 className="display mt-8 text-4xl text-paper">
        Selamat datang, <span className="text-amber">{name}</span> 👋
      </h1>
      <p className="mt-3 font-sans text-muted">
        Ini dashboard ahli anda. Buat masa ini ia kosong — kandungan penuh
        (progress profil, task, kehadiran, berita) akan dibina di fasa
        seterusnya.
      </p>

      <div className="mt-8 rounded-xl border border-amber/40 bg-amber/10 p-5 font-sans text-sm text-paper/90">
        ✅ Login berjaya! Jika anda nampak skrin ini, bermakna sistem auth
        (Clerk) berfungsi dan laluan ini dilindungi.
      </div>
    </div>
  );
}
