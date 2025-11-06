/**
 * Service Worker for VOOBIZE PWA
 * - Handles PWA installation and caching
 * - Manages push notifications
 * - Provides offline support
 * - Auto-update mechanism
 */

// 🔥 IMPORTANT: เปลี่ยน version นี้ทุกครั้งที่ deploy!
// Format: voobize-YYYYMMDD-HHmm (ตัวอย่าง: voobize-20250106-1430)
const CACHE_VERSION = 'voobize-20251106-1749';
const CACHE_NAME = `${CACHE_VERSION}-static`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;

// Enhanced console logging with emojis
console.log('%c🚀 VOOBIZE Service Worker', 'font-size: 16px; font-weight: bold; color: #3b82f6;');
console.log('%c📦 Version: ' + CACHE_VERSION, 'font-size: 14px; color: #10b981;');
console.log('%c💾 Static Cache: ' + CACHE_NAME, 'font-size: 12px; color: #8b5cf6;');
console.log('%c⚡ Runtime Cache: ' + RUNTIME_CACHE, 'font-size: 12px; color: #f59e0b;');

// Assets to cache on install
const PRECACHE_ASSETS = [
  '/',
  '/logo.png',
  '/manifest.json',
];

// Install event - cache essential assets
self.addEventListener('install', (event) => {
  console.log('%c⬇️ [SW] Installing Service Worker...', 'font-weight: bold; color: #3b82f6;');
  console.log('%c📦 [SW] Version: ' + CACHE_VERSION, 'color: #10b981;');

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('%c💾 [SW] Caching ' + PRECACHE_ASSETS.length + ' assets', 'color: #8b5cf6;');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => {
        console.log('%c✅ [SW] Installation complete!', 'font-weight: bold; color: #10b981;');
        return self.skipWaiting(); // Activate immediately
      })
      .catch((error) => {
        console.error('%c❌ [SW] Installation failed:', 'color: #ef4444;', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('%c🔄 [SW] Activating Service Worker...', 'font-weight: bold; color: #f59e0b;');

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        const oldCaches = cacheNames.filter(
          (name) => name !== CACHE_NAME && name !== RUNTIME_CACHE
        );

        if (oldCaches.length > 0) {
          console.log('%c🗑️ [SW] Deleting ' + oldCaches.length + ' old cache(s):', 'color: #ef4444;', oldCaches);
        } else {
          console.log('%c✨ [SW] No old caches to delete', 'color: #10b981;');
        }

        return Promise.all(
          oldCaches.map((name) => caches.delete(name))
        );
      })
      .then(() => {
        console.log('%c✅ [SW] Service Worker activated!', 'font-weight: bold; color: #10b981;');
        console.log('%c🎯 [SW] Version: ' + CACHE_VERSION + ' is now active', 'color: #10b981;');
        return self.clients.claim(); // Take control immediately
      })
  );
});

// Fetch event - Smart caching strategy
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip external requests (API calls to backend)
  if (!event.request.url.startsWith(self.location.origin)) return;

  const url = new URL(event.request.url);

  // Strategy 1: Network-First for HTML pages (always fresh)
  if (event.request.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname === '/') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Cache the new version
          if (response.status === 200) {
            const responseToCache = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          // Fallback to cache if offline
          return caches.match(event.request).then((cachedResponse) => {
            return cachedResponse || new Response('Offline - Please check your connection', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({ 'Content-Type': 'text/plain' }),
            });
          });
        })
    );
    return;
  }

  // Strategy 2: Cache-First for static assets (images, fonts, JS, CSS)
  if (url.pathname.match(/\.(jpg|jpeg|png|gif|webp|svg|woff|woff2|ttf|eot|js|css)$/)) {
    event.respondWith(
      caches.match(event.request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }

          return fetch(event.request.clone())
            .then((response) => {
              if (response.status === 200) {
                const responseToCache = response.clone();
                caches.open(RUNTIME_CACHE).then((cache) => {
                  cache.put(event.request, responseToCache);
                });
              }
              return response;
            });
        })
    );
    return;
  }

  // Strategy 3: Network-First for everything else
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.status === 200) {
          const responseToCache = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});

// Push notification event - will be implemented later
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push notification received');

  if (!event.data) {
    console.log('[Service Worker] Push event has no data');
    return;
  }

  try {
    const data = event.data.json();
    const title = data.title || 'VOOBIZE';
    const options = {
      body: data.body || 'คุณมีการแจ้งเตือนใหม่',
      icon: data.icon || '/logo.png',
      badge: '/logo.png',
      tag: data.tag || 'notification',
      data: {
        url: data.url || '/',
        ...data.data,
      },
      requireInteraction: false,
      vibrate: [200, 100, 200],
    };

    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  } catch (error) {
    console.error('[Service Worker] Error handling push:', error);
  }
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked');

  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window open
        for (const client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }

        // Open new window
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Message event - for communication with main thread
self.addEventListener('message', (event) => {
  console.log('[Service Worker] Message received:', event.data);

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
