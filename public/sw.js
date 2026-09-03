/* global self, caches */

const VERSION = "relay-pwa-v2";
const STATIC_CACHE = `${VERSION}-static`;
const OFFLINE_URL = "/offline";
const PRECACHE = [
  OFFLINE_URL,
  "/manifest.webmanifest",
  "/relay-ball.svg",
  "/pwa-192.png",
  "/pwa-512.png",
  "/pwa-maskable-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      caches
        .keys()
        .then((keys) => Promise.all(keys.filter((key) => key !== STATIC_CACHE).map((key) => caches.delete(key)))),
      self.registration.navigationPreload?.enable(),
      self.clients.claim(),
    ]),
  );
});

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data?.json() ?? {};
  } catch {
    payload = {};
  }
  const title = typeof payload.title === "string" ? payload.title : "Relay update";
  const body = typeof payload.body === "string" ? payload.body : "Open Relay for details.";
  const href = typeof payload.href === "string" && payload.href.startsWith("/") ? payload.href : "/notifications";
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: "/pwa-192.png",
      badge: "/pwa-192.png",
      tag: typeof payload.tag === "string" ? payload.tag : undefined,
      data: { href },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const href = event.notification.data?.href || "/notifications";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      const existing = clients.find((client) => "focus" in client);
      if (existing) return existing.navigate(href).then((client) => client?.focus());
      return self.clients.openWindow(href);
    }),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          return (await event.preloadResponse) || (await fetch(request));
        } catch {
          return (await caches.match(OFFLINE_URL)) || Response.error();
        }
      })(),
    );
    return;
  }

  const immutableAsset = url.pathname.startsWith("/_next/static/");
  const appIcon = PRECACHE.includes(url.pathname);
  if (!immutableAsset && !appIcon) return;

  event.respondWith(
    (async () => {
      const cached = await caches.match(request);
      if (cached) return cached;
      const response = await fetch(request);
      if (response.ok) {
        const cache = await caches.open(STATIC_CACHE);
        await cache.put(request, response.clone());
      }
      return response;
    })(),
  );
});
