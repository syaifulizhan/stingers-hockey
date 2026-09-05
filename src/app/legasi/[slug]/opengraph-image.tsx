import { kadOg, SAIZ_OG, JENIS_OG } from "@/lib/og";
import { getRecordBySlug } from "@/lib/legasi-data";

export const alt = "Hall of Honour — Stingers Hockey";
export const size = SAIZ_OG;
export const contentType = JENIS_OG;

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const r = await getRecordBySlug(slug);

  if (!r) {
    return kadOg({ kicker: "Hall of Honour", tajuk: "Rekod Kekal Stingers Hockey" });
  }

  return kadOg({
    kicker: `Hall of Honour · ${r.recordNo}`,
    tajuk: r.fullName,
    perihal: [r.result, r.event].filter(Boolean).join(" · ") || undefined,
    latar: r.heroImage,
  });
}
