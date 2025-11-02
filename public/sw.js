const CACHE_NAME = "burger-app-v1"
const urlsToCache = ["/", "/dashboard", "/map", "/stats", "/icon-192.jpg", "/icon-512.jpg"]

const EXCLUDED_URLS = ["maps.googleapis.com", "places.googleapis.com", "supabase.co", "/api/places", "/api/auth"]

function shouldExcludeFromCache(url) {
  return EXCLUDED_URLS.some((excluded) => url.includes(excluded))
}

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache)))
})

self.addEventListener("fetch", (event) => {
  if (shouldExcludeFromCache(event.request.url)) {
    return
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.status === 200 && event.request.url.startsWith(self.location.origin)) {
          const responseClone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone))
        }
        return response
      })
      .catch(() => caches.match(event.request)),
  )
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName)
          }
        }),
      )
    }),
  )
})
