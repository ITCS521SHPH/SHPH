// Service Worker for offline functionality
const CACHE_NAME = "shph-v1"
const urlsToCache = [
  "/",
  "/auth/login",
  "/offline",
  // Add other critical pages and assets
]

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache)))
})

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches
      .match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request)
      })
      .catch(() => {
        // If both cache and network fail, show offline page
        if (event.request.destination === "document") {
          return caches.match("/offline")
        }
      }),
  )
})

// Background sync for queued records
self.addEventListener("sync", (event) => {
  if (event.tag === "background-sync") {
    event.waitUntil(
      // Trigger sync when connection is restored
      self.registration.showNotification("SHPH", {
        body: "Syncing your data...",
        icon: "/icon-192x192.png",
        badge: "/badge-72x72.png",
      }),
    )
  }
})
