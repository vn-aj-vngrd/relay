/* global self, caches */

const VERSION = "relay-pwa-v1";
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
