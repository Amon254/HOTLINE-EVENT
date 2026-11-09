/* ─── EventHotline Service Worker (v3) ─────────────────────────
   Principe : on n'intercepte JAMAIS les pages, le JS/CSS ni l'API.
   Le navigateur les charge normalement → toujours la dernière version,
   aucune erreur « Failed to fetch ». Seules les images, polices et
   icônes sont mises en cache pour accélérer les visites suivantes.
   ─────────────────────────────────────────────────────────── */

const CACHE_NAME = 'eventhotline-v3';

self.addEventListener('install', () => {
  self.skipWaiting();
});

// Activation — supprime tous les anciens caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (['localhost', '127.0.0.1'].includes(self.location.hostname)) return;

  // Seulement images / polices : cache d'abord, sinon réseau (sans jamais planter)
  if (!['image', 'font'].includes(request.destination)) return;

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((c) => c.put(request, clone));
          }
          return response;
        })
        .catch(() => Response.error());
    })
  );
});

// Notifications push (messages)
self.addEventListener('push', (event) => {
  const data = (event.data && event.data.json()) || {};
  event.waitUntil(
    self.registration.showNotification(data.title || 'EventHotline', {
      body: data.body || 'Vous avez un nouveau message',
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      vibrate: [200, 100, 200],
      data: { url: data.url || '/' },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(clients.openWindow(url));
});