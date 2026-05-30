import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Next.js 16: fail ini dahulunya "middleware.ts" — kini dinamakan "proxy.ts".
// Ia HANYA dijalankan pada laluan /portal (lihat config.matcher di bawah),
// jadi website public (/, /hustle-gear) langsung tidak disentuh.

// Laluan portal yang WAJIB log masuk dahulu.
const isProtectedRoute = createRouteMatcher([
  "/portal/dashboard(.*)",
  "/portal/coach(.*)",
  "/portal/onboarding(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect(); // belum log masuk → halau ke sign-in
  }
});

export const config = {
  // Hanya /portal/* — bukan laluan public.
  matcher: ["/portal/:path*"],
};
