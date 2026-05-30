import Link from "next/link";

export default function OnboardingPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6 py-10 text-center">
      <span className="font-sans text-sm font-semibold uppercase tracking-[0.3em] text-amber">
        Langkah Seterusnya
      </span>
      <h1 className="display mt-4 text-4xl text-paper">Lengkapkan Profil</h1>
      <p className="mt-3 font-sans text-muted">
        Borang profil (nama penuh, tahun, kelas, dan lain-lain) akan dibina di
        Fasa 3. Buat masa ini, anda boleh terus ke dashboard.
      </p>
      <Link
        href="/portal/dashboard"
        className="mx-auto mt-7 rounded-full bg-amber px-7 py-3 font-sans text-sm font-semibold uppercase tracking-wider text-ink transition-colors hover:bg-amber-deep"
      >
        Ke Dashboard →
      </Link>
    </div>
  );
}
