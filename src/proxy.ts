import { NextResponse } from "next/server";
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

const SIGN_IN_PATH = "/portal/sign-in";

const isPublicPortalRoute = createRouteMatcher([
  "/portal", // halaman pendaratan portal (butang Log Masuk / Daftar)
  "/portal/sign-in(.*)",
  "/portal/sign-up(.*)",
]);

const isPortalApi = createRouteMatcher(["/api/portal/(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (isPublicPortalRoute(req)) return;

  const { userId } = await auth();
  if (userId) return;

  // Redirect ditulis sendiri di sini, BUKAN melalui auth.protect(). Clerk
  // membina URL log masuknya dari NEXT_PUBLIC_CLERK_SIGN_IN_URL, dan apabila
  // nilai env itu salah ia menghantar pengguna ke laluan yang tidak wujud
  // (diselesaikan secara relatif terhadap laluan semasa). Laluan log masuk
  // ini sepadan dengan struktur folder sebenar, jadi ia tidak boleh terpesong.
  if (isPortalApi(req)) {
    return NextResponse.json(
      { ok: false, error: "Sila log masuk." },
      { status: 401 }
    );
  }

  const url = new URL(SIGN_IN_PATH, req.url);
  url.searchParams.set("redirect_url", req.url);
  return NextResponse.redirect(url);
});

export const config = {
  // Hanya laluan portal — termasuk API portal supaya auth() berfungsi di sana.
  // Laluan public (/, /hustle-gear, /api/register, /api/order) tidak disentuh.
  matcher: ["/portal", "/portal/:path*", "/api/portal/:path*"],
};
