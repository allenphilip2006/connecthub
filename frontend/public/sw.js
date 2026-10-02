const CACHE_NAME = 'connecthub-cache-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((key) => key !== CACHE_NAME && caches.delete(key)))
    )
  );
});

self.addEventListener('fetch', (event) => {
  // Skip chrome-extension and other non-http schemes
  if (!(event.request.url.indexOf('http') === 0)) return;

  event.respondWith(
    caches.match(event.request).then((res) => {
      return res || fetch(event.request).catch((err) => {
        // If fetch fails (e.g. offline)
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
        // For other assets, we can't do much, but we shouldn't throw an uncaught error
        console.warn(`[SW] Fetch failed for: ${event.request.url}`, err);
        return new Response('Network error occurred', {
          status: 408,
          statusText: 'Network error occurred',
        });
      });
    })
  );
});
