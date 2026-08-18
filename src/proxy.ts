import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Next.js 16: fail ini dahulunya "middleware.ts" — kini dinamakan "proxy.ts".
// Ia HANYA dijalankan pada laluan /portal (lihat config.matcher di bawah),
// jadi website public (/, /hustle-gear) langsung tidak disentuh.
//
// DEFAULT DENY. Dahulu fail ini menyenaraikan laluan yang perlu dilindungi,
// jadi mana-mana laluan portal BAHARU terdedah secara senyap (contohnya
// /portal/admin dan semua /api/portal/*). Kini terbalik: semuanya dilindungi
// kecuali laluan yang disenaraikan secara jelas sebagai awam di bawah.
//
// Nota: proxy hanya semakan "optimistic" — ia cuma tentukan LOG MASUK.
// Kelulusan allowlist dikuatkuasakan di server oleh src/lib/portal-guard.ts
// dan sekali lagi oleh RLS Supabase.

const isPublicPortalRoute = createRouteMatcher([
  "/portal", // halaman pendaratan portal (butang Log Masuk / Daftar)
  "/portal/sign-in(.*)",
  "/portal/sign-up(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicPortalRoute(req)) {
    await auth.protect(); // belum log masuk → halau ke sign-in
  }
});

export const config = {
  // Hanya laluan portal — termasuk API portal supaya auth() berfungsi di sana.
  // Laluan public (/, /hustle-gear, /api/register, /api/order) tidak disentuh.
  matcher: ["/portal", "/portal/:path*", "/api/portal/:path*"],
};
