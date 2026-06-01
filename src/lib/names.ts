// Nama paparan ahli (untuk panel jurulatih). Pangkalnya username Clerk; jika
// jurulatih tetapkan nama sebenar (display_name), ia muncul dalam kurungan.
// Contoh: "saifalimran (Saif)". Tanpa nama coach: "saifalimran".
export function memberName(
  fullName: string | null | undefined,
  displayName?: string | null
): string {
  const base = (fullName && fullName.trim()) || "(tanpa nama)";
  const real = displayName && displayName.trim();
  return real ? `${base} (${real})` : base;
}

// Nama tunggal — guna nama yang jurulatih tetapkan (display_name) jika ada,
// jika tidak guna nama sedia ada. (Tiada kurungan.)
export function preferredName(
  fullName: string | null | undefined,
  displayName?: string | null
): string {
  const real = displayName && displayName.trim();
  return real || (fullName && fullName.trim()) || "(tanpa nama)";
}
