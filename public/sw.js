// Service worker Stingers Hockey — membolehkan pemasangan (PWA) & sokongan luar talian asas.
// Strategi: network-first untuk navigasi (sentiasa cuba versi terbaru), cache fallback.

const CACHE = "stingers-v4";
const OFFLINE_URLS = ["/", "/hustle-gear"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(OFFLINE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

// ── Push notification ──
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = {};
  }
  const title = data.title || "Stingers Hockey";
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || "",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      data: { url: data.url || "/portal/dashboard" },
      vibrate: [80, 40, 80],
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((wins) => {
      for (const w of wins) {
        if (w.url.includes(url) && "focus" in w) return w.focus();
      }
      return self.clients.openWindow(url);
    })
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);

  // JANGAN cache data dinamik — API & permintaan data Next.js (RSC).
  // Ini punca "data lama" selepas submit; sentiasa ambil dari rangkaian.
  const isRsc =
    request.headers.get("RSC") === "1" ||
    request.headers.get("Next-Router-Prefetch") === "1" ||
    url.searchParams.has("_rsc");
  if (url.pathname.startsWith("/api/") || isRsc) {
    return; // biar pelayar buat permintaan rangkaian biasa (tiada cache)
  }

  // Navigasi halaman → network-first, fallback ke cache (atau "/") bila offline.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match(request).then((r) => r || caches.match("/")))
    );
    return;
  }

  // Cache HANYA aset statik (same-origin: /_next/static, gambar, fon, css/js).
  const isStatic =
    url.origin === self.location.origin &&
    (url.pathname.startsWith("/_next/static") ||
      /\.(png|jpe?g|svg|webp|gif|ico|woff2?|css|js|json)$/i.test(url.pathname));
  if (!isStatic) return; // selainnya → rangkaian biasa

  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request).then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(request, copy));
          }
          return res;
        })
    )
  );
});
