import { notFound } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { buildReportData } from "@/lib/build-report";
import ReportDocument from "@/components/portal/ReportDocument";
import PrintBar from "@/components/portal/PrintButton";

// Laporan boleh dicetak. RLS: ahli hanya baca data sendiri; jurulatih/admin
// boleh baca mana-mana pemain (untuk akses pemain lain).
export default async function ReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerSupabase();
  const data = await buildReportData(supabase, id);
  if (!data) notFound();

  return (
    <div className="min-h-screen bg-ink py-6">
      <PrintBar />
      <div className="overflow-x-auto px-4">
        <div className="mx-auto w-fit overflow-hidden rounded-lg shadow-xl">
          <ReportDocument data={data} />
        </div>
      </div>
    </div>
  );
}
