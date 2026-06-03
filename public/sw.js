const CACHE_NAME = "subber-v5";
const APP_SHELL = [
  "/",
  "/index.html",
  "/logo.png",
  "/manifest.webmanifest",
  "/fonts/AutopromPro-BlackRoundedItalic.otf",
  "/dueffe/logo%20dueffe%20dark%20appbar.png",
  "/dueffe/logo%20dueffe%20light%20appbar.png"
];
const CACHE_FIRST_PATHS = new Set(APP_SHELL.filter((url) => url !== "/" && url !== "/index.html"));

function cacheResponse(request, response) {
  const copy = response.clone();
  caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
  return response;
}

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  if (url.origin === self.location.origin && CACHE_FIRST_PATHS.has(url.pathname)) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        const refreshed = fetch(event.request)
          .then((response) => cacheResponse(event.request, response))
          .catch(() => cached);
        return cached || refreshed;
      })
    );
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => cacheResponse(event.request, response))
      .catch(() => caches.match(event.request).then((cached) => cached || caches.match("/index.html")))
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type !== "SUBBER_NOTIFY") return;

  const { title, body } = event.data.payload;
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: "/logo.png",
      badge: "/logo.png",
      tag: "subber-renewal",
      renotify: true
    })
  );
});
