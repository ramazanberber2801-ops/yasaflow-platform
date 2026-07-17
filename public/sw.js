// Yasaflow Service Worker — push notifications + safe update caching
const CACHE_NAME = 'yasaflow-v19';
const STATIC_ASSETS = [
  '/manifest.json',
  '/favicon.svg',
  '/images/dtim-logo.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll(STATIC_ASSETS).catch(() => {})
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.map((name) => caches.delete(name)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  if (url.origin !== location.origin) {
    event.respondWith(fetch(event.request));
    return;
  }

  const request = event.request;
  const isAppShell = request.mode === 'navigate' || url.pathname === '/' || url.pathname.endsWith('.html');
  const isBuildAsset = url.pathname.startsWith('/assets/') || url.pathname.endsWith('.js') || url.pathname.endsWith('.css');

  if (isAppShell || isBuildAsset) {
    event.respondWith(
      fetch(request, { cache: 'no-store' })
        .then((response) => response)
        .catch(() => caches.match(request).then((cached) => cached || new Response('', { status: 504 })))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      return cached || fetch(request).then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone).catch(() => {}));
        return response;
      });
    })
  );
});

self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};

  const title = data.title || 'Yasaflow';
  const messageId = data.message_id || null;
  const targetUrl = new URL(data.url || '/', self.location.origin);
  if (messageId) targetUrl.searchParams.set('notification', messageId);

  const options = {
    body: data.body || 'Yeni bildirim var.',
    icon: '/images/dtim-logo.svg',
    badge: '/images/dtim-logo.svg',
    tag: messageId ? `yasaflow-${messageId}` : undefined,
    data: {
      url: `${targetUrl.pathname}${targetUrl.search}${targetUrl.hash}`,
      message_id: messageId,
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const target = new URL(event.notification.data?.url || '/', self.location.origin).href;
  event.waitUntil((async () => {
    const windowClients = await clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of windowClients) {
      if ('focus' in client) {
        await client.navigate(target);
        return client.focus();
      }
    }
    return clients.openWindow(target);
  })());
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CLEAR_CACHES') {
    event.waitUntil(
      caches.keys().then((names) => Promise.all(names.map((name) => caches.delete(name))))
    );
  }
});