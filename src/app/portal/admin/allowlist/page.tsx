import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireCoachPage } from "@/lib/portal-guard";
import AllowlistManager from "@/components/portal/admin/AllowlistManager";

// Halaman ini dahulunya komponen klien tanpa sebarang semakan peranan di
// server — sesiapa yang log masuk boleh membukanya. Kini ia komponen server
// yang menguatkuasakan peranan sebelum apa-apa dihantar ke pelayar.
export const dynamic = "force-dynamic";

export default async function AllowlistPage() {
  await requireCoachPage();

  return (
    <div className="min-h-screen bg-ink px-6 py-12">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/portal/coach"
          className="inline-flex items-center gap-1.5 font-sans text-sm text-muted transition-colors hover:text-amber"
        >
          <ArrowLeft className="h-4 w-4" /> Kembali ke panel jurulatih
        </Link>
        <h1 className="display mt-4 text-4xl text-paper">Allowlist Portal</h1>
        <p className="mb-10 mt-2 font-sans text-sm text-muted">
          Siapa yang dibenarkan masuk portal ahli.
        </p>

        <AllowlistManager />
      </div>
    </div>
  );
}
