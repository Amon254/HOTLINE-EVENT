/* ─── EventHotline Service Worker ─────────────────────────────
   Cache statique + stratégie réseau-d'abord pour l'API
   ─────────────────────────────────────────────────────────── */

const CACHE_NAME = 'eventhotline-v2';
const STATIC_ASSETS = [
  '/',
  '/lieux',
  '/carte',
  '/a-propos',
  '/static/js/main.js',
  '/static/css/main.css',
  '/favicon.svg',
  '/manifest.json',
];

// Installation — mise en cache des assets statiques
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Mise en cache des assets statiques');
      return cache.addAll(STATIC_ASSETS).catch(() => {
        // Ignorer les erreurs individuelles
      });
    })
  );
  self.skipWaiting();
});

// Activation — nettoyage des anciens caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Interception des requêtes
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (['localhost', '127.0.0.1'].includes(self.location.hostname)) return; // dev : aucun cache
  const url = new URL(request.url);

  // API Django → réseau d'abord, pas de cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(() =>
        new Response(
          JSON.stringify({ error: 'Hors ligne — vérifiez votre connexion' }),
          { status: 503, headers: { 'Content-Type': 'application/json' } }
        )
      )
    );
    return;
  }

  // Code (JS/CSS) et pages → RÉSEAU D'ABORD : on voit toujours la dernière version,
  // le cache ne sert qu'en secours hors ligne.
  const isCode = request.destination === 'script' || request.destination === 'style' || request.destination === 'document';
  if (isCode) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((c) => c.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match(request).then((c) => c || caches.match('/')))
    );
    return;
  }

  // Images, polices, icônes → cache d'abord
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response.ok && (request.url.includes('/static/') || request.url.includes('/favicon') || request.url.includes('/manifest'))) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((c) => c.put(request, clone));
        }
        return response;
      });
    })
  );
});

// Notifications push (pour les futurs messages)
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};
  const title = data.title || 'EventHotline';
  const options = {
    body: data.body || 'Vous avez un nouveau message',
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    vibrate: [200, 100, 200],
    data: { url: data.url || '/' },
    actions: [
      { action: 'open', title: 'Voir' },
      { action: 'close', title: 'Fermer' },
    ],
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// Clic sur notification
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'open' || !event.action) {
    const url = event.notification.data?.url || '/';
    event.waitUntil(clients.openWindow(url));
  }
});