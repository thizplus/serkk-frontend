/**
 * Service Worker for SUEKK PWA
 * - Handles PWA installation and caching
 * - Provides offline support
 * - Auto-update mechanism
 *
 * 📝 Caching Strategy (Safe Approach):
 * ✅ Cache: Static files (JS, CSS, fonts), Logo, HTML shell
 * ❌ Don't Cache: Next.js Image Optimization, Videos, API calls
 * 🎯 Goal: Keep cache < 20MB (prevent 200MB bloat from feed images)
 */

// 🔥 IMPORTANT: เปลี่ยน version นี้ทุกครั้งที่ deploy!
// Format: suekk-YYYYMMDD-HHmm (ตัวอย่าง: suekk-20250106-1430)
const CACHE_VERSION = 'suekk-20251117-safe-cache';
const CACHE_NAME = `${CACHE_VERSION}-static`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;

// Enhanced console logging with emojis
console.log('%c🚀 SUEKK Service Worker', 'font-size: 16px; font-weight: bold; color: #3b82f6;');
console.log('%c📦 Version: ' + CACHE_VERSION, 'font-size: 14px; color: #10b981;');
console.log('%c💾 Static Cache: ' + CACHE_NAME, 'font-size: 12px; color: #8b5cf6;');
console.log('%c⚡ Runtime Cache: ' + RUNTIME_CACHE, 'font-size: 12px; color: #f59e0b;');

// Assets to cache on install
const PRECACHE_ASSETS = [
  '/',
  '/logo.png',
  // Note: /manifest.json is now a dynamic route, not cached
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

  // ============================================================================
  // 🚫 Cache Exclusions (Safe Approach)
  // ============================================================================

  // 0. ไม่ cache รูปจาก Next.js Image Optimization
  // Reason: รูป feed ที่เลื่อนผ่านจะทำให้ cache โตถึง 200MB
  if (url.pathname.startsWith('/_next/image')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // 1. ไม่ cache API calls
  // Reason: ข้อมูลต้องเป็น realtime + ไม่เปลืองพื้นที่
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // 2. ไม่ cache videos/audio
  // Reason: ไฟล์ใหญ่มาก (40MB+) + stream จาก R2 ได้อยู่แล้ว
  if (url.pathname.match(/\.(mp4|webm|ogg|mp3)$/)) {
    event.respondWith(fetch(event.request));
    return;
  }

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
  // Note: รูปที่ cache ที่นี่คือ static images เท่านั้น (เช่น logo, icons)
  // ไม่ใช่รูปจาก feed ที่มาจาก /_next/image (ถูกกรองใน exclusions แล้ว)
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

  // Strategy 3: Network-Only for everything else (no cache)
  // Reason: หลังจากกรอง exclusions + Strategy 1-2 แล้ว
  // สิ่งที่เหลือไม่ควร cache (เพื่อความปลอดภัยและป้องกัน cache bloat)
  event.respondWith(
    fetch(event.request)
      .catch(() => {
        // ถ้า offline และไม่มีใน cache ก็ให้ fallback
        return caches.match(event.request).then((cachedResponse) => {
          return cachedResponse || new Response('Offline', {
            status: 503,
            statusText: 'Service Unavailable',
          });
        });
      })
  );
});

// Push notifications removed (iOS not supported)
// Use WebSocket notifications instead for real-time updates

// ============================================================================
// Message Handler - For PWA updates
// ============================================================================

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('%c⏭️ [SW] Skipping waiting...', 'color: #f59e0b;');
    self.skipWaiting();
  }
});
