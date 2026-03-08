const CACHE_NAME = 'stp-viewer-v1';
const ASSETS = [
  './stp_viewer.html',
  './manifest-stp.json',
  './icon-stp-192.png',
  './icon-stp-512.png',
  'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js',
  'https://cdn.jsdelivr.net/npm/occt-import-js@0.0.23/dist/occt-import-js.js',
  'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600&family=Outfit:wght@300;400;500;600;700&display=swap'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (response.ok) {
          const url = new URL(event.request.url);
          // Cache CDN assets and WASM
          if (url.hostname.includes('googleapis') || url.hostname.includes('gstatic') ||
              url.hostname.includes('cdnjs') || url.hostname.includes('jsdelivr')) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
        }
        return response;
      });
    }).catch(() => {
      if (event.request.destination === 'document') return caches.match('./stp_viewer.html');
    })
  );
});
