/**
 * Service Worker für Memory Pro
 * Implementiert Offline-Funktionalität und Caching-Strategien
 */

const CACHE_NAME = 'memory-pro-v1.0.0';
const STATIC_CACHE = `${CACHE_NAME}-static`;
const DYNAMIC_CACHE = `${CACHE_NAME}-dynamic`;

// Dateien für Offline-Funktionalität
const STATIC_FILES = [
  '/memory/',
  '/memory/index.html',
  '/memory/main.js',
  '/memory/style.css',
  '/memory/manifest.webmanifest'
];

// Cacheable Extensions
const CACHEABLE_EXTENSIONS = [
  '.html', '.css', '.js', '.png', '.jpg', '.jpeg', '.gif', 
  '.svg', '.webp', '.woff2', '.woff', '.ttf', '.json'
];

/**
 * Service Worker Installation
 */
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Installing Memory Pro...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[ServiceWorker] Caching static files');
        return cache.addAll(STATIC_FILES);
      })
      .then(() => {
        console.log('[ServiceWorker] Installation complete');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[ServiceWorker] Installation failed:', error);
      })
  );
});

/**
 * Service Worker Aktivierung
 */
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activating Memory Pro...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('[ServiceWorker] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[ServiceWorker] Activation complete');
        return self.clients.claim();
      })
  );
});

/**
 * Fetch Event Handler
 */
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  
  if (request.method !== 'GET') return;
  
  const isCacheable = CACHEABLE_EXTENSIONS.some(ext => 
    url.pathname.includes(ext) || url.pathname.includes('/memory/')
  );
  
  if (isCacheable) {
    event.respondWith(cacheFirst(request));
  } else {
    event.respondWith(networkFirst(request));
  }
});

/**
 * Cache-First-Strategie
 */
async function cacheFirst(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
    
  } catch (error) {
    console.error('[ServiceWorker] Cache-first failed:', error);
    
    if (request.destination === 'document') {
      const fallback = await caches.match('/memory/index.html');
      return fallback || new Response('Offline - Memory Pro ist nicht verfügbar', {
        status: 503,
        headers: { 'Content-Type': 'text/plain' }
      });
    }
    
    return new Response('Offline', { status: 503 });
  }
}

/**
 * Network-First-Strategie
 */
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
    
  } catch (error) {
    console.log('[ServiceWorker] Network failed, trying cache:', error);
    
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    return new Response('Offline - Inhalt nicht verfügbar', {
      status: 503,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}
