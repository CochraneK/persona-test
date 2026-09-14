const CACHE = 'persona-test-v7';
const APP_SHELL = [
  './',
  './index.html',
  './play.html',
  './manifest.webmanifest',
  './assets/icon.svg',
  './assets/home.css',
  './assets/growth.css',
  './assets/home.js',
  './assets/app.css',
  './assets/content-pack.css',
  './assets/interaction-pack.css',
  './assets/app.js',
  './assets/data/test-data.js',
  './assets/data/content-pack.js',
  './assets/data/interaction-pack.js',
  './assets/core/ui.js',
  './assets/core/router.js',
  './assets/core/result.js',
  './assets/core/share.js',
  './assets/core/history.js',
  './assets/renderers/grid.js',
  './assets/renderers/mbti.js',
  './assets/renderers/chair.js',
  './assets/renderers/balloon.js',
  './assets/renderers/cyberball.js',
  './assets/renderers/rank.js',
  './assets/renderers/binary.js',
  './assets/renderers/allocate.js',
  './assets/renderers/challenge.js',
  './assets/renderers/mirror.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(async () => (await caches.match(request)) || (await caches.match('./play.html')) || (await caches.match('./index.html')))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, clone));
        }
        return response;
      });
    })
  );
});
