// Hantar gambar (bukti tempahan / tugasan) ke Google Drive melalui Apps Script.
// Menggunakan webhook yang sama dengan borang (SHEETS_WEBHOOK_URL). Apucara
// mengambil gambar daripada URL awam Supabase, simpan ke folder Drive, dan
// memulangkan { ok, fileUrl, fileId }. Lihat google-apps-script.gs.

type DriveTarget = "tempahan" | "tugasan";

type DriveResult = { ok: true; fileUrl: string; fileId: string } | { ok: false; error: string };

// Tarikh hari ini (zon Malaysia) dalam format YYYY-MM-DD untuk nama fail.
export function todayMY(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kuala_Lumpur" }).format(new Date());
}

// 3 patah nama pertama (untuk nama fail bukti tempahan).
export function firstThreeWords(name: string): string {
  return (name || "").trim().split(/\s+/).slice(0, 3).join(" ") || "Tanpa Nama";
}

export async function pushImageToDrive(args: {
  target: DriveTarget;
  imageUrl: string;
  fileName: string;
}): Promise<DriveResult> {
  const webhookUrl = process.env.SHEETS_WEBHOOK_URL;
  if (!webhookUrl) return { ok: false, error: "SHEETS_WEBHOOK_URL belum diset." };

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "drive-upload", ...args }),
    });
    const json = (await res.json()) as DriveResult;
    if (!res.ok || !json.ok) {
      return { ok: false, error: ("error" in json && json.error) || `HTTP ${res.status}` };
    }
    return json;
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}
