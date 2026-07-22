/* SANTAREX ERP — Service Worker (vanilla, aucune dépendance)
 *
 * Stratégies :
 *  - Assets statiques (/_next/static, icons, css, images, fonts) -> cache-first.
 *  - Navigations (pages HTML)                                    -> network-first, repli cache, puis /offline.html.
 *  - API GET « consultation » (patients, médicaments, référentiels…) -> network-first
 *      avec repli cache => consultation possible hors-ligne.
 *  - API mutations (POST/PUT/PATCH) échouées hors-ligne          -> mises en file
 *      d'attente (IndexedDB) et rejouées automatiquement au retour du réseau.
 *
 * SÉCURITÉ :
 *  - /auth/* n'est JAMAIS mis en cache ni mis en file (tokens, sessions).
 *  - Aucune réponse d'API mutation n'est servie depuis un cache (jamais de données périmées
 *    pour une écriture).
 *  - DELETE n'est jamais mis en file (trop risqué hors-ligne) : échec normal remonté à l'UI.
 *
 * L'origine de l'API est transmise via le query param de l'URL d'enregistrement :
 *   navigator.serviceWorker.register('/sw.js?apiOrigin=https://api.exemple.com')
 */

const VERSION = 'v1.1.0';
const STATIC_CACHE = `santarex-static-${VERSION}`;
const PAGES_CACHE = `santarex-pages-${VERSION}`;
const API_CACHE = `santarex-api-${VERSION}`;
const OFFLINE_URL = '/offline.html';

// Origine de l'API (transmise à l'enregistrement). Vide => on ne gère que le same-origin /api/.
let API_ORIGIN = '';
try {
  API_ORIGIN = new URL(self.location.href).searchParams.get('apiOrigin') || '';
} catch (_e) {
  API_ORIGIN = '';
}

// Assets pré-mis en cache (coquille minimale + page offline brandée)
const PRECACHE_URLS = [
  OFFLINE_URL,
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/logo-icon-tr.png',
  '/favicon-32-tr.png',
];

const CURRENT_CACHES = [STATIC_CACHE, PAGES_CACHE, API_CACHE];

// Endpoints d'API en lecture que l'on peut mettre en cache pour l'offline.
// (Testés sur le pathname complet, préfixe /api/v1 inclus.)
const CACHEABLE_API_PATTERNS = [
  /\/patients(\/|\?|$)/i,
  /\/pharmacie\/medicaments/i,
  /\/laboratoire\/types-analyse/i,
  /\/dashboard\/stats/i,
  /\/hospitalisation\/lits/i,
  /\/urgences\/actifs/i,
];

// ---- IndexedDB : file d'attente des mutations hors-ligne ----
const DB_NAME = 'santarex-offline';
const DB_STORE = 'mutations';

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(DB_STORE)) {
        db.createObjectStore(DB_STORE, { keyPath: 'id', autoIncrement: true });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function idbAdd(record) {
  return openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(DB_STORE, 'readwrite');
        tx.objectStore(DB_STORE).add(record);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      })
  );
}

function idbGetAll() {
  return openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(DB_STORE, 'readonly');
        const req = tx.objectStore(DB_STORE).getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      })
  );
}

function idbDelete(id) {
  return openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(DB_STORE, 'readwrite');
        tx.objectStore(DB_STORE).delete(id);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      })
  );
}

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

// ---- Messages depuis les pages ----
self.addEventListener('message', (event) => {
  const data = event.data || {};
  if (data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  } else if (data.type === 'REPLAY_QUEUE') {
    event.waitUntil(replayQueue());
  }
});

// ---- Background Sync (si supporté) ----
self.addEventListener('sync', (event) => {
  if (event.tag === 'santarex-mutations') {
    event.waitUntil(replayQueue());
  }
});

// ---- Helpers ----
function isStaticAsset(url) {
  if (url.pathname.startsWith('/_next/static/')) return true;
  return /\.(?:css|js|png|jpg|jpeg|svg|gif|webp|ico|woff2?|ttf|otf|eot)$/i.test(
    url.pathname
  );
}

function isApiRequest(url) {
  if (API_ORIGIN && url.origin === API_ORIGIN) return true;
  // Repli : API servie en same-origin sous /api/
  if (url.origin === self.location.origin && url.pathname.startsWith('/api/')) return true;
  return false;
}

function isAuthPath(url) {
  return /\/auth(\/|$)/i.test(url.pathname);
}

function isCacheableApiGet(url) {
  if (isAuthPath(url)) return false;
  return CACHEABLE_API_PATTERNS.some((re) => re.test(url.pathname));
}

// Notifie toutes les pages ouvertes (ex. pour rafraîchir après synchro).
function notifyClients(message) {
  return self.clients.matchAll({ includeUncontrolled: true }).then((clients) => {
    clients.forEach((c) => c.postMessage(message));
  });
}

// Rejoue la file des mutations. Best-effort : on ne bloque jamais, on ignore les échecs.
let replaying = false;
async function replayQueue() {
  if (replaying) return;
  replaying = true;
  try {
    const items = await idbGetAll();
    let synced = 0;
    for (const item of items) {
      try {
        const res = await fetch(item.url, {
          method: item.method,
          headers: item.headers,
          body: item.body,
          credentials: item.credentials || 'same-origin',
        });
        // 2xx/4xx : requête traitée par le serveur -> on retire de la file.
        // (un 4xx signifie que rejouer ne servira à rien ; on évite une file infinie)
        if (res.status < 500) {
          await idbDelete(item.id);
          if (res.ok) synced += 1;
        }
      } catch (_e) {
        // Toujours hors-ligne : on garde l'élément et on stoppe la boucle.
        break;
      }
    }
    if (synced > 0) {
      await notifyClients({ type: 'QUEUE_SYNCED', count: synced });
    }
  } catch (_e) {
    // silencieux
  } finally {
    replaying = false;
  }
}

// Met une mutation en file et tente d'enregistrer un background sync.
async function queueMutation(request) {
  const bodyText = await request.clone().text().catch(() => '');
  const headers = {};
  request.headers.forEach((value, key) => {
    headers[key] = value;
  });
  await idbAdd({
    url: request.url,
    method: request.method,
    headers,
    body: bodyText || undefined,
    credentials: request.credentials,
    ts: Date.now(),
  });
  // Tente un background sync ; sinon la page rejouera au prochain 'online'.
  if (self.registration && self.registration.sync) {
    try {
      await self.registration.sync.register('santarex-mutations');
    } catch (_e) {
      /* ignore */
    }
  }
}

// ---- Fetch ----
self.addEventListener('fetch', (event) => {
  const req = event.request;

  let url;
  try {
    url = new URL(req.url);
  } catch (_e) {
    return;
  }

  const apiReq = isApiRequest(url);

  // ---- Requêtes API ----
  if (apiReq) {
    // On ne touche jamais à l'auth : réseau natif.
    if (isAuthPath(url)) return;

    // GET « consultation » : network-first + repli cache.
    if (req.method === 'GET') {
      if (!isCacheableApiGet(url)) return; // autres GET : réseau natif
      event.respondWith(
        fetch(req)
          .then((res) => {
            if (res && res.ok) {
              const copy = res.clone();
              caches.open(API_CACHE).then((cache) => cache.put(req, copy));
            }
            return res;
          })
          .catch(() =>
            caches.match(req).then((cached) => {
              if (cached) {
                // Marque la réponse comme provenant du cache (consultation offline).
                const headers = new Headers(cached.headers);
                headers.set('X-Santarex-From-Cache', '1');
                return cached.blob().then(
                  (blob) => new Response(blob, { status: cached.status, headers })
                );
              }
              return new Response(
                JSON.stringify({ error: { message: 'Hors-ligne : donnée non disponible en cache.' } }),
                { status: 503, headers: { 'Content-Type': 'application/json' } }
              );
            })
          )
      );
      return;
    }

    // Mutations POST/PUT/PATCH : réseau, et en cas d'échec -> file d'attente.
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
      event.respondWith(
        fetch(req.clone()).catch(async () => {
          await queueMutation(req).catch(() => undefined);
          return new Response(
            JSON.stringify({
              queued: true,
              message: 'Hors-ligne : modification enregistrée, elle sera synchronisée automatiquement.',
            }),
            { status: 202, headers: { 'Content-Type': 'application/json' } }
          );
        })
      );
      return;
    }

    // DELETE et autres : réseau natif (pas de mise en file).
    return;
  }

  // ---- Ressources same-origin (app shell) : uniquement les GET ----
  if (req.method !== 'GET') return;
  if (url.origin !== self.location.origin) return;

  // Endpoint API same-origin déjà traité plus haut si apiReq ; ici on ignore /api/.
  if (url.pathname.startsWith('/api/')) return;

  // Assets statiques : cache-first.
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

  // Navigations (pages HTML) : network-first, repli cache, puis offline.html.
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

  // Autres GET same-origin : network-first léger avec repli cache.
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
