// Nama paparan ahli. Kadang pendaftaran guna akaun ibu/bapa, jadi admin
// boleh tetapkan nama sebenar pemain (display_name) — jika ada, ia digunakan
// terus (cth: "Zahin"); jika tidak, guna nama pendaftaran.
export function memberName(
  fullName: string | null | undefined,
  displayName?: string | null
): string {
  const real = displayName && displayName.trim();
  if (real) return real;
  return (fullName && fullName.trim()) || "(tanpa nama)";
}
