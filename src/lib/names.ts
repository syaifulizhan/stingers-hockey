// Nama paparan ahli. Kadang pendaftaran guna akaun ibu/bapa, jadi admin
// boleh tetapkan nama sebenar pemain (display_name). Format: "Daftar (Sebenar)".
export function memberName(
  fullName: string | null | undefined,
  displayName?: string | null
): string {
  const base = (fullName && fullName.trim()) || "(tanpa nama)";
  const real = displayName && displayName.trim();
  return real ? `${base} (${real})` : base;
}
