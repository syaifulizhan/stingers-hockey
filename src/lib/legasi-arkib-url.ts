import { legacyUrl } from "@/lib/legasi";

// Penolong URL Wayback yang tulen — tiada kebergantungan pelayan, supaya
// komponen klien boleh memautkan salinan arkib tanpa menarik masuk klien
// admin Supabase.

const WAYBACK_PREFIX = "https://web.archive.org/web/";

/** Alamat Wayback bagi sesuatu slug — sah dipapar walaupun belum diarkib. */
export function waybackUrl(slug: string): string {
  return `${WAYBACK_PREFIX}*/${legacyUrl(slug).replace(/^https:\/\//, "")}`;
}
