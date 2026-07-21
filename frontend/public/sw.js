/* SANTAREX ERP — Service Worker (vanilla, no dependency)
 * Strategy:
 *  - /api/*                -> network only (JAMAIS de cache : données sensibles / inter-tenant / fraîcheur)
 *  - static assets         -> cache-first  (/_next/static, icons, css, images, fonts)
 *  - navigations (pages)   -> network-first, repli cache, puis page offline.html
 * Versioned caches; old caches cleaned on activate. skipWaiting + clients.claim.
 */

const VERSION = 'v1.0.0';
const STATIC_CACHE = `santarex-static-${VERSION}`;
const PAGES_CACHE = `santarex-pages-${VERSION}`;
const OFFLINE_URL = '/offline.html';

// Assets pré-mis en cache (coquille minimale + page offline brandée)
const PRECACHE_URLS = [
  OFFLINE_URL,
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/logo-icon-tr.png',
  '/favicon-32-tr.png',
];

const CURRENT_CACHES = [STATIC_CACHE, PAGES_CACHE];

// ---- Install : pré-cache de la coquille offline ----
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .catch(() => undefined)
      .then(() => self.skipWaiting())
  );
});

// ---- Activate : nettoyage des anciens caches ----
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(
          names
            .filter((name) => !CURRENT_CACHES.includes(name))
            .map((name) => caches.delete(name))
        )
      )
      .then(() => self.clients.claim())
  );
});

// Permet à la page de forcer l'activation d'une nouvelle version
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// ---- Helpers ----
function isStaticAsset(url) {
  if (url.pathname.startsWith('/_next/static/')) return true;
  return /\.(?:css|js|png|jpg|jpeg|svg|gif|webp|ico|woff2?|ttf|otf|eot)$/i.test(
    url.pathname
  );
}

// ---- Fetch ----
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // On ne gère que les GET
  if (req.method !== 'GET') return;

  let url;
  try {
    url = new URL(req.url);
  } catch (_e) {
    return;
  }

  // Requêtes cross-origin : laisser passer (pas d'interception)
  if (url.origin !== self.location.origin) return;

  // 1) API : réseau seulement, jamais de cache
  if (url.pathname.startsWith('/api/')) {
    return; // laisse le navigateur faire la requête réseau native
  }

  // 2) Assets statiques : cache-first
  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;
        return fetch(req)
          .then((res) => {
            if (res && res.ok && res.type === 'basic') {
              const copy = res.clone();
              caches.open(STATIC_CACHE).then((cache) => cache.put(req, copy));
            }
            return res;
          })
          .catch(() => cached);
      })
    );
    return;
  }

  // 3) Navigations (pages HTML) : network-first, repli cache, puis offline.html
  if (req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html')) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(PAGES_CACHE).then((cache) => cache.put(req, copy));
          }
          return res;
        })
        .catch(() =>
          caches.match(req).then((cached) => {
            if (cached) return cached;
            return caches.match(OFFLINE_URL);
          })
        )
    );
    return;
  }

  // 4) Autres GET same-origin : network-first léger avec repli cache
  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res && res.ok && res.type === 'basic') {
          const copy = res.clone();
          caches.open(STATIC_CACHE).then((cache) => cache.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req))
  );
});
