/* Studio service worker — offline shell + asset caching.
   Strategy:
   - Static build assets & fonts: cache-first
   - Pages: network-first with offline fallback to cache
   - API: network-only (data integrity) */
const CACHE = "studio-v1"
const PRECACHE = ["/", "/manifest.webmanifest", "/icons/icon-192.png", "/icons/icon-512.png"]

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
  )
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  )
})

self.addEventListener("fetch", (event) => {
  const req = event.request
  if (req.method !== "GET") return
  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return
  if (url.pathname.startsWith("/api/")) return // never cache API

  // static assets: cache-first
  if (url.pathname.startsWith("/_next/static") || url.pathname.startsWith("/icons/") || /\.(css|js|woff2?|png|jpg|jpeg|webp|svg|ttf|otf)$/.test(url.pathname)) {
    event.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            const copy = res.clone()
            caches.open(CACHE).then((cache) => cache.put(req, copy))
            return res
          })
      )
    )
    return
  }

  // pages: network-first, fall back to cache (offline shell)
  event.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone()
        caches.open(CACHE).then((cache) => cache.put(req, copy))
        return res
      })
      .catch(() => caches.match(req).then((hit) => hit || caches.match("/")))
  )
})
