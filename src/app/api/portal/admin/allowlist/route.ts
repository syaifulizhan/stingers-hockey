// File ini tidak digunakan lagi - approval management ada di
// /api/portal/admin/pending-approvals

import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    { error: "Gunakan /api/portal/admin/pending-approvals" },
    { status: 410 }
  );
}
