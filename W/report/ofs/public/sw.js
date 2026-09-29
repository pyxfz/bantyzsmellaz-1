/* AI Security Sentinel — service worker
 * Offline-capable docs PWA: network-first for documents, cache-first for
 * immutable build assets and images, with an offline fallback page.
 */
// Bump on every deploy: `activate` deletes every cache that does not end in the current version,
// which is what stops a returning visitor from being served the previous build's shell.
const VERSION = 'v3';
const PRECACHE = `sentinel-precache-${VERSION}`;
const ASSETS = `sentinel-assets-${VERSION}`;
const PAGES = `sentinel-pages-${VERSION}`;
const OFFLINE_URL = '/offline.html';

const PRECACHE_URLS = [
  '/',
  OFFLINE_URL,
  '/manifest.webmanifest',
  '/favicon.svg',
  '/favicon-32.png',
  '/apple-touch-icon.png',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(PRECACHE);
      // Individual adds so one 404 cannot fail the whole install.
      await Promise.all(
        PRECACHE_URLS.map((url) =>
          cache.add(new Request(url, { cache: 'reload' })).catch(() => undefined)
        )
      );
      await self.skipWaiting();
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => !key.endsWith(`-${VERSION}`))
          .map((key) => caches.delete(key))
      );
      if (self.registration.navigationPreload) {
        await self.registration.navigationPreload.enable().catch(() => undefined);
      }
      await self.clients.claim();
    })()
  );
});

const isAsset = (url) =>
  url.pathname.startsWith('/_astro/') ||
  url.pathname.startsWith('/_pagefind/') ||
  /\.(?:css|js|mjs|woff2?|ttf|otf|png|jpg|jpeg|gif|webp|avif|svg|ico|json|txt|webmanifest)$/.test(
    url.pathname
  );

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response && response.ok && response.type === 'basic') {
    cache.put(request, response.clone());
  }
  return response;
}

async function networkFirst(request) {
  const cache = await caches.open(PAGES);
  try {
    const preload = await (request.preloadResponse || Promise.resolve(undefined));
    const response = preload || (await fetch(request));
    if (response && response.ok && response.type === 'basic') {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await cache.match(request, { ignoreSearch: true });
    if (cached) return cached;
    const preloaded = await caches.match(OFFLINE_URL);
    if (preloaded) return preloaded;
    throw new Error('offline');
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname === '/sw.js') return;

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request));
    return;
  }

  if (isAsset(url)) {
    event.respondWith(cacheFirst(request, ASSETS));
  }
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
